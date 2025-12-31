import sqlite3 from 'better-sqlite3';
import { hasUser, removeUser } from './user.js';

const db = sqlite3('user_extra.db')
db.pragma('journal_mode = WAL')
db.exec(`
    CREATE TABLE IF NOT EXISTS follow (
        follower INTEGER NOT NULL,
        followee INTEGER NOT NULL,
        followed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (follower, followee)
    )
`)
db.exec(`
    CREATE TABLE IF NOT EXISTS block (
        blocker INTEGER NOT NULL,
        blocked INTEGER NOT NULL,
        block_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (blocker, blocked)
    )
`)
db.exec(`
    CREATE TABLE IF NOT EXISTS permission (
        id INTEGER PRIMARY KEY,
        message INTEGER NOT NULL DEFAULT 1,
        post INTEGER NOT NULL DEFAULT 1,
        blog INTEGER NOT NULL DEFAULT 1,
        login INTEGER NOT NULL DEFAULT 1,
        upload INTEGER NOT NULL DEFAULT 1
    )
`)
db.exec(`
    CREATE TABLE IF NOT EXISTS descriptions (
        id INTEGER PRIMARY KEY,
        description TEXT NOT NULL DEFAULT ''
    )
`)
db.exec(`
    CREATE TABLE IF NOT EXISTS stylesheets (
        id INTEGER PRIMARY KEY,
        stylesheet TEXT DEFAULT NULL
    )
`)
db.exec('CREATE INDEX IF NOT EXISTS idx_follow_follower ON follow(follower, followed_at DESC)')
db.exec('CREATE INDEX IF NOT EXISTS idx_follow_followee ON follow(followee, followed_at DESC)')

export const createUserExtra = function(id) {
    const tx = db.transaction(() => {
        db.prepare('INSERT INTO permission (id) VALUES (?)').run(id)
        db.prepare('INSERT INTO descriptions (id) VALUES (?)').run(id)
        db.prepare('INSERT INTO stylesheets (id) VALUES (?)').run(id)
    })
    tx()
}

export const follow = function(follower, followee) {
    if (follower === followee) return {error: "不能关注自己！"}
    if (!hasUser(followee)) return {error: "用户不存在！"}
    if (!hasUser(follower)) return {error: "请先登录！"}
    const statement = db.prepare('SELECT 1 FROM block WHERE (blocker = ? AND blocked = ?) OR (blocker = ? AND blocked = ?) LIMIT 1')
    const row = statement.get(follower, followee, followee, follower)
    if (!!row) return {error: "屏蔽/被屏蔽状态下无法关注！"}
    const statement2 = db.prepare('INSERT OR IGNORE INTO follow (follower, followee) VALUES (?, ?)')
    const res = statement2.run(follower, followee)
    if (res.changes > 0) return {}
    else return {error: "您已经关注过该用户！"}
}

export const block = function(blocker, blocked) {
    if (blocker === blocked) return {error: "不能屏蔽自己！"}
    if (!hasUser(blocked)) return {error: "用户不存在！"}
    if (!hasUser(blocker)) return {error: "请先登录！"}
    const tx = db.transaction(() => {
        const insert = db.prepare('INSERT OR IGNORE INTO block (blocker, blocked) VALUES (?, ?)')
        const res = insert.run(blocker, blocked)
        if (res.changes === 0) throw new Error("已经屏蔽过该用户")

        const delFollow = db.prepare(`
            DELETE FROM follow 
            WHERE (follower = ? AND followee = ?) OR (follower = ? AND followee = ?)
        `);
        delFollow.run(blocker, blocked, blocked, blocker)
    })

    try {
        tx()
        return {}
    } catch (e) {
        return { error: e.message || "屏蔽失败" }
    }
}

export const unfollow = function(follower, followee) {
    if (follower === followee) return {error: "不能取消关注自己！"}
    if (!hasUser(followee)) return {error: "用户不存在！"}
    if (!hasUser(follower)) return {error: "请先登录！"}
    const statement = db.prepare('DELETE FROM follow WHERE follower = ? AND followee = ?')
    const res = statement.run(follower, followee)
    if (res.changes > 0) return {}
    else return {error: "您尚未关注该用户！"}
}

export const isFollowed = function(follower, followee) {
    if (follower === followee) return false
    if (!hasUser(followee)) return false
    if (!hasUser(follower)) return false
    const statement = db.prepare('SELECT 1 FROM follow WHERE follower = ? AND followee = ?')
    const row = statement.get(follower, followee)
    return !!row
}

export const isBlocked = function(blocker, blocked) {
    if (blocker === blocked) return false
    if (!hasUser(blocked)) return false
    if (!hasUser(blocker)) return false
    const statement = db.prepare('SELECT 1 FROM block WHERE blocker = ? AND blocked = ?')
    const row = statement.get(blocker, blocked)
    return !!row
}

export const unblock = function(blocker, blocked) {
    if (blocker === blocked) return {error: "不能取消屏蔽自己！"}
    if (!hasUser(blocked)) return {error: "用户不存在！"}
    if (!hasUser(blocker)) return {error: "请先登录！"}
    const statement = db.prepare('DELETE FROM block WHERE blocker = ? AND blocked = ?')
    const res = statement.run(blocker, blocked)
    if (res.changes > 0) return {}
    else return {error: "您尚未屏蔽该用户！"}
}

export const getDesc = function(id) {
    const statement = db.prepare('SELECT description FROM descriptions WHERE id = ?')
    const row = statement.get(id)
    return row ? row.description : ""
}

export const setDesc = function(id, desc) {
    if (!Number.isInteger(id)) return
    if (typeof desc !== 'string') return
    const statement = db.prepare('UPDATE descriptions SET description = ? WHERE id = ?')
    statement.run(desc, id)
}

export const getCSS = function(id) {
    const statement = db.prepare('SELECT stylesheet FROM stylesheets WHERE id = ?')
    const row = statement.get(id)
    return row ? row.stylesheet : ""
}

export const setCSS = function(id, css) {
    if (!Number.isInteger(id)) return
    if (typeof css !== 'string' && css !== null) return
    const statement = db.prepare('UPDATE stylesheets SET stylesheet = ? WHERE id = ?')
    statement.run(css, id)
}

export const setPerm = function(id, field, val) {
    if (!Number.isInteger(id)) return
    const statement = db.prepare(`UPDATE permission SET ${field} = ? WHERE id = ?`)
    statement.run(!!val, id)
}

export const getPerm = function(id, field) {
    if (!Number.isInteger(id)) return
    const statement = db.prepare(`SELECT ${field} FROM permission WHERE id = ?`)
    const row = statement.get(id)
    return row ? row[field] : true
}

export const countFollowing = function(uid) {
    if (!Number.isInteger(uid) || !hasUser(uid)) return 0
    const row = db.prepare('SELECT COUNT(*) AS c FROM follow WHERE follower = ?').get(uid)
    return row?.c ?? 0
}

export const countFollower = function(uid) {
    if (!Number.isInteger(uid) || !hasUser(uid)) return 0
    const row = db.prepare('SELECT COUNT(*) AS c FROM follow WHERE followee = ?').get(uid)
    return row?.c ?? 0
}

export const listFollowing = function(uid, page) {
    if (!Number.isInteger(uid) || !hasUser(uid)) return []
    const count = countFollowing(uid)
    const maxPage = Math.ceil(count / 20)
    if (page < 1 || page > maxPage) return []

    const stmt = db.prepare(`
        SELECT followee FROM follow
        WHERE follower = ?
        ORDER BY followed_at DESC
        LIMIT 20 OFFSET ?
    `)
    return stmt.all(uid, (page - 1) * 20).map(row => row.followee)
}

export const listFollower = function(uid, page) {
    if (!Number.isInteger(uid) || !hasUser(uid)) return []
    const count = countFollower(uid)
    const maxPage = Math.ceil(count / 20)
    if (page < 1 || page > maxPage) return []

    const stmt = db.prepare(`
        SELECT follower FROM follow
        WHERE followee = ?
        ORDER BY followed_at DESC
        LIMIT 20 OFFSET ?
    `)
    return stmt.all(uid, (page - 1) * 20).map(row => row.follower)
}

export const closeUserExtraDb = function() {
    if (db.open) {
        db.pragma('wal_checkpoint(FULL)')
        db.close()
    }
    console.log('Successfully closed the database user_extra.db')
}

export const removeUserEx = function(id) {
    removeUser(id)
    const tx = db.transaction(() => {
        db.prepare('DELETE FROM follow WHERE follower = ? OR followee = ?').run(id, id)
        db.prepare('DELETE FROM block WHERE blocker = ? OR blocked = ?').run(id, id)
        db.prepare('DELETE FROM permission WHERE id = ?').run(id)
        db.prepare('DELETE FROM descriptions WHERE id = ?').run(id)
        db.prepare('DELETE FROM stylesheets WHERE id = ?').run(id)
    })
    tx()
}