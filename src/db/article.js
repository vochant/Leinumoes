import sqlite3 from 'better-sqlite3'
import { userDb as db } from './user.js'
import { getPerm, isBlocked } from './user_extra.js'

db.exec(`
    CREATE TABLE IF NOT EXISTS divides (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        desc TEXT NOT NULL DEFAULT '',
        announcement INTEGER NOT NULL DEFAULT 0
    )
`)
if (db.prepare('SELECT COUNT(*) AS c FROM divides').get().c === 0) {
    db.prepare('INSERT INTO divides (name) VALUES (?)').run('未分类')
}
db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        divide INTEGER NOT NULL DEFAULT 1,
        locked INTEGER NOT NULL DEFAULT 0,
        vote INTEGER NOT NULL DEFAULT 0,
        ncomments INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (divide) REFERENCES divides(id) ON DELETE SET DEFAULT
    )
`)
db.exec(`CREATE INDEX IF NOT EXISTS idx_articles_user ON articles (author, created_at DESC)`)
db.exec(`CREATE INDEX IF NOT EXISTS idx_articles_divide ON articles (divide, created_at DESC)`)
db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts USING fts5(
        title,
        content,
        content = 'articles',
        content_rowid = 'id',
        tokenize = 'unicode61 remove_diacritics 2'
    )
`)
db.exec(`
    CREATE TRIGGER IF NOT EXISTS articles_ai AFTER INSERT ON articles BEGIN
        INSERT INTO articles_fts(rowid, title, content) VALUES (new.id, new.title, new.content);
    END
`)
db.exec(`
    CREATE TRIGGER IF NOT EXISTS articles_ad AFTER DELETE ON articles BEGIN
        DELETE FROM articles_fts WHERE rowid = old.id;
    END
`)
db.exec(`
    CREATE TRIGGER IF NOT EXISTS articles_au AFTER UPDATE ON articles BEGIN
        UPDATE articles_fts SET title = new.title, content = new.content WHERE rowid = old.id;
    END
`)
db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        floor INTEGER NOT NULL,
        aid INTEGER NOT NULL,
        sender INTEGER NOT NULL,
        content TEXT NOT NULL,
        reply_to INTEGER DEFAULT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (aid) REFERENCES articles(id) ON DELETE CASCADE
    )
`)
db.exec(`CREATE INDEX IF NOT EXISTS idx_comments_article ON comments (aid, floor DESC)`)
db.exec(`
    CREATE TABLE IF NOT EXISTS pinned (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        aid INTEGER NOT NULL UNIQUE,
        FOREIGN KEY (aid) REFERENCES articles(id) ON DELETE CASCADE
    )
`)
db.exec(`
    CREATE TABLE IF NOT EXISTS votes (
        uid INTEGER NOT NULL,
        aid INTEGER NOT NULL,
        vote INTEGER NOT NULL CHECK (vote IN (-1, 1)),
        PRIMARY KEY (uid, aid)
    )
`)

export const getArticle = function(aid) {
    const statement = db.prepare(`
        SELECT a.vote, a.author, a.title, a.content, a.divide, a.locked, a.created_at, a.updated_at,
               u.name, u.nickname, u.tag, u.bio, d.name AS dname
        FROM articles a
        JOIN users u ON a.author = u.id
        JOIN divides d ON a.divide = d.id
        WHERE a.id = ? LIMIT 1
    `)
    const row = statement.get(aid)
    if (!row) return { invalid: true }
    return {
        invalid: false,
        id: aid,
        author: row.author,
        title: row.title,
        content: row.content,
        divide: row.divide,
        locked: row.locked,
        created_at: row.created_at,
        vote: row.vote,
        updated_at: row.updated_at,
        user_name: row.nickname ? row.nickname : row.name,
        user_tag: row.tag,
        user_bio: row.bio ? row.bio : '这个人很神秘，并没有写下什么。',
        divide_name: row.dname
    }
}

export const countComments = function(aid) {
    const statement = db.prepare(`SELECT ncomments AS total FROM articles WHERE id = ?`)
    return statement.get(aid).total
}

export const getComments = function(aid, page) {
    if (!Number.isInteger(page) || page < 1) page = 1
    const statement = db.prepare(`
        SELECT c.id, c.sender, c.content, c.created_at, c.floor, c.reply_to,
               r.floor AS rfloor, u.name, u.nickname, u.tag AS user_tag
        FROM comments c
        JOIN users u ON c.sender = u.id
        LEFT JOIN comments r ON c.reply_to = r.id
        WHERE c.aid = ?
        ORDER BY c.created_at DESC
        LIMIT 20 OFFSET (? - 1) * 20
    `)
    const row = statement.all(aid, page)
    return row.map(v => {
        v.user_name = v.nickname || v.name
        return v
    })
}

export const createArticle = function(id, title, content, div) {
    const statement = db.prepare('INSERT INTO articles (author, title, content, divide) VALUES (?, ?, ?, ?)')
    statement.run(id, title, content, div)
}

export const checkGrant = function(uid, id) {
    const statement = db.prepare('SELECT a.author, u.permission FROM articles a JOIN users u ON a.author = u.id WHERE a.id = ?')
    const row = statement.get(id)
    const statement2 = db.prepare('SELECT permission FROM users WHERE id = ?')
    const row2 = statement2.get(uid)
    if (!row) return row2.permission > 1
    if (!row2) return false
    return uid == row.author || row2.permission > Math.max(1, row.permission)
}

export const checkCommGrant = function(uid, id) {
    const statement = db.prepare('SELECT c.sender, u.permission FROM comments c JOIN users u ON c.sender = u.id WHERE c.id = ?')
    const row = statement.get(id)
    const statement2 = db.prepare('SELECT permission FROM users WHERE id = ?')
    const row2 = statement2.get(uid)
    if (!row) return row2.permission > 1
    if (!row2) return false
    return uid == row.sender || row2.permission > Math.max(1, row.permission)
}

export const removeArticle = function(id) {
    const tx = db.transaction(() => {
        db.prepare('DELETE FROM comments WHERE aid = ?').run(id)
        db.prepare('DELETE FROM articles WHERE id = ?').run(id)
    })
    tx()
}

export const modifyArticle = function(id, ntitle, ncontent) {
    const statement = db.prepare(`UPDATE articles SET title = ?, content = ?, updated_at = datetime('now') WHERE id = ?`)
    statement.run(ntitle, ncontent, id)
}

export const createComment = function(uid, aid, content, reply) {
    const article = db.prepare(`SELECT author FROM articles WHERE id = ?`).get(aid)
    if (!article) return { error: '文章不存在！' }

    const uperm = db.prepare('SELECT permission FROM users WHERE id = ?').get(uid)

    if (!getPerm(uid, 'post') || uperm == 0) return { error: '您已被禁言！' }

    if (isBlocked(article.author, uid)) {
        const aperm = Math.max(1, db.prepare('SELECT permission FROM users WHERE id = ?').get(article.author).permission || 1)
        if (uperm <= aperm) return { error: '您已被屏蔽！' }
    }

    if (reply) {
        const replied = db.prepare(`SELECT sender, aid FROM comments WHERE id = ?`).get(reply)
        if (!replied) return { error: '回复的评论不存在！' }
        if (replied.aid != aid) return { error: '禁止跨文章回复！' }

        if (isBlocked(replied.sender, uid)) {
            const rperm = Math.max(1, db.prepare('SELECT permission FROM users WHERE id = ?').get(replied.sender).permission || 1)
            if (uperm <= rperm) return { error: '您已被屏蔽！' }
        }
    }

    const tx = db.transaction(() => {
        const row = db.prepare(`SELECT MAX(floor) + 1 AS next FROM comments WHERE aid = ?`).get(aid)
        const floor = row?.next ?? 1
        db.prepare(`
            INSERT INTO comments (floor, aid, sender, content, reply_to)
            VALUES (?, ?, ?, ?, ?)
        `).run(floor, aid, uid, content, reply)
        db.prepare(`UPDATE articles SET ncomments = ncomments + 1 WHERE id = ?`).run(aid)
    })
    tx()

    return {}
}

export function floorToPage(aid, floor) {
    const row = db.prepare(`
        SELECT COUNT(*) AS rank
        FROM comments
        WHERE aid = ? AND floor > ?
    `).get(aid, floor)

    const position = (row?.rank ?? 0) + 1
    const page = Math.ceil(position / 20)
    return page
}

export const removeComment = function(id, uid) {
    if (!checkCommGrant(uid, id)) return
    const tx = db.transaction(() => {
        let aid = db.prepare(`SELECT aid FROM comments WHERE id = ?`).get(id).aid
        db.prepare(`DELETE FROM comments WHERE id = ?`).run(id)
        db.prepare(`UPDATE articles SET ncomments = ncomments - 1 WHERE id = ?`).run(aid)
    })
    tx()
}

export const countArticlesByUser = function(id) {
    const statement = db.prepare('SELECT COUNT(*) AS total FROM articles WHERE author = ?')
    return statement.get(id).total
}

export const countArticlesByDivide = function(id) {
    const statement = db.prepare('SELECT COUNT(*) AS total FROM articles WHERE divide = ?')
    return statement.get(id).total
}

export const getArticlesByUser = function(id, page) {
    if (!Number.isInteger(page) || page < 1) page = 1
    const statement = db.prepare('SELECT a.vote, a.ncomments, a.id, a.title, a.created_at, a.updated_at, a.divide, a.locked, d.name AS dname FROM articles a JOIN divides d ON d.id = a.divide WHERE a.author = ? ORDER BY a.created_at DESC LIMIT 20 OFFSET (? - 1) * 20')
    return statement.all(id, page)
}

export const getArticlesByDivide = function(id, page) {
    if (!Number.isInteger(page) || page < 1) page = 1
    const statement = db.prepare('SELECT a.id, a.vote, a.ncomments, a.author, a.title, a.created_at, a.updated_at, u.name, u.nickname FROM articles a JOIN users u ON u.id = a.author WHERE a.divide = ? ORDER BY a.created_at DESC LIMIT 20 OFFSET (? - 1) * 20')
    return statement.all(id, page).map(row => ({
        ...row,
        display_name: row.nickname || row.name
    }))
}

export const createDivide = function(name) {
    const statement = db.prepare('INSERT INTO divides (name) VALUES (?)')
    return statement.run(name).lastInsertRowid
}

export const removeDivide = function(id) {
    if (id == 1) return
    const statement = db.prepare('DELETE FROM divides WHERE id = ?')
    statement.run(id)
}

export const setAnnouncement = function(id, ann) {
    db.prepare('UPDATE divides SET announcement = ? WHERE id = ?').run(ann ? 1 : 0, id)
}

export const renameDivide = function(id, name) {
    db.prepare('UPDATE divides SET name = ? WHERE id = ?').run(name, id)
}

export const descDivide = function(id, desc) {
    db.prepare('UPDATE divides SET desc = ? WHERE id = ?').run(desc, id)
}

export const getDivides = function() {
    const statement = db.prepare('SELECT * FROM divides ORDER BY id ASC')
    return statement.all()
}

export const findDivide = function(name) {
    return !!db.prepare('SELECT 1 FROM divides WHERE name = ?').get(name)
}

export const hasDivide = function(id) {
    return !!db.prepare('SELECT 1 FROM divides WHERE id = ?').get(id)
}

export const getDivide = function(id) {
    const statement = db.prepare('SELECT * FROM divides WHERE id = ?')
    const row = statement.get(id)
    if (!row) return null
    return row
}

export const countSearch = function(keyword) {
    const statement = db.prepare(`SELECT COUNT(*) AS count FROM articles_fts WHERE articles_fts MATCH ?`)
    return statement.get(keyword)?.count || 0
}

export const getArticlesBySearch = function(keyword, page) {
    if (!Number.isInteger(page) || page < 1) page = 1
    const statement = db.prepare(`
        SELECT a.author, a.vote, a.ncomments, a.id, a.title, a.created_at, a.updated_at, a.divide, a.locked, d.name AS dname, u.name, u.nickname
        FROM articles_fts f
        JOIN articles a ON a.id = f.rowid
        JOIN divides d ON d.id = a.divide
        JOIN users u ON u.id = a.author
        WHERE f MATCH ?
        ORDER BY rank
        LIMIT 20 OFFSET (? - 1) * 20
    `)
    return statement.all(keyword, page).map(row => ({
        ...row,
        display_name: row.nickname || row.name
    }))
}

export const pinArticle = function(aid) {
    const tx = db.transaction(() => {
        const article = db.prepare(`SELECT 1 FROM articles WHERE id = ?`).get(aid)
        if (!article) return

        db.prepare(`INSERT OR IGNORE INTO pinned (aid) VALUES (?)`).run(aid)
    })

    tx()
}

export const unpinArticle = function(aid) {
    const tx = db.transaction(() => {
        db.prepare(`DELETE FROM pinned WHERE aid = ?`).run(aid)
    })

    tx()
}

export const countPinned = function() {
    const row = db.prepare(`SELECT COUNT(*) AS total FROM pinned`).get()
    return row.total
}

export const getPinned = function(page) {
    const statement = db.prepare(`
        SELECT a.author, a.vote, a.ncomments, a.id, a.title, a.created_at, a.updated_at, a.divide, a.locked, d.name AS dname, u.name, u.nickname
        FROM pinned p
        JOIN articles a ON a.id = p.aid
        JOIN users u ON u.id = a.author
        JOIN divides d ON d.id = a.divide
        ORDER BY p.id DESC
        LIMIT 20 OFFSET (? - 1) * 20
    `)
    return statement.all(page).map(row => ({
        ...row,
        display_name: row.nickname || row.name
    }))
}

export const countArticles = function() {
    return db.prepare('SELECT COUNT(*) AS total FROM articles').get().total
}

export const getArticles = function(page) {
    const statement = db.prepare(`
        SELECT a.author, a.vote, a.ncomments, a.id, a.title, a.created_at, a.updated_at, a.divide, a.locked, d.name AS dname, u.name, u.nickname
        FROM articles a
        JOIN users u ON u.id = a.author
        JOIN divides d ON d.id = a.divide
        ORDER BY a.id DESC
        LIMIT 20 OFFSET (? - 1) * 20
    `)
    return statement.all(page).map(row => ({
        ...row,
        display_name: row.nickname || row.name
    }))
}

export const changeVote = function(uid, aid, val) {
    const tx = db.transaction(() => {
        const old = db.prepare(`SELECT vote FROM votes WHERE uid = ? AND aid = ?`).get(uid, aid)

        if (val === 0) {
            if (old) {
                db.prepare(`DELETE FROM votes WHERE uid = ? AND aid = ?`).run(uid, aid)
                db.prepare(`UPDATE articles SET vote = vote - ? WHERE id = ?`).run(old.vote, aid)
            }
        }
        else if (val === 1 || val === -1) {
            if (!old) {
                db.prepare(`INSERT INTO votes (uid, aid, vote) VALUES (?, ?, ?)`).run(uid, aid, val)
                db.prepare(`UPDATE articles SET vote = vote + ? WHERE id = ?`).run(val, aid)
            }
            else if (old.vote !== val) {
                db.prepare(`UPDATE votes SET vote = ? WHERE uid = ? AND aid = ?`).run(val, uid, aid)
                db.prepare(`UPDATE articles SET vote = vote + ? WHERE id = ?`).run(val - old.vote, aid)
            }
        }
    })

    tx()
}

export const getVote = function(uid, aid) {
    const row = db.prepare(`SELECT vote FROM votes WHERE uid = ? AND aid = ?`).get(uid, aid)
    return row ? row.vote : 0
}