import sqlite3 from 'better-sqlite3'
import { config } from '../framework/config.js'
import { checkCode } from './invite.js'
import argon2 from 'argon2'

const db = sqlite3('user.db')
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        permission INTEGER NOT NULL,
        invitation TEXT NOT NULL,
        nickname TEXT DEFAULT NULL,
        bio TEXT DEFAULT NULL,
        tag TEXT DEFAULT NULL,
        email TEXT DEFAULT NULL,
        phone TEXT DEFAULT NULL, 
        birth TEXT DEFAULT NULL,
        realname TEXT DEFAULT NULL,
        gender TEXT DEFAULT NULL,
        job TEXT DEFAULT NULL,
        address TEXT DEFAULT NULL,
        url TEXT DEFAULT NULL,
        created_at TEXT DEFAULT (date('now')),
        blogName TEXT NOT NULL,
        pronoun TEXT DEFAULT NULL,
        version INTEGER NOT NULL DEFAULT 0
    )
`)

export const createUser = async function(name, password, inv) {
    const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count
    const statement = db.prepare('INSERT INTO users (name, password, permission, invitation, blogName) VALUES (?, ?, ?, ?, ?)')
    return statement.run(name, await argon2.hash(password), userCount === 0 ? 3 : 1, inv, name + "的博客").lastInsertRowid
}

export const getVersion = function(id) {
    if (!Number.isInteger(id)) return NaN
    const statement = db.prepare('SELECT version FROM users WHERE id = ?')
    const row = statement.get(id)
    return row ? row.version : NaN
}

export const setPassword = async function(id, password) {
    const hash = await argon2.hash(password)
    const statement = db.prepare('UPDATE users SET password = ?, version = version + 1 WHERE id = ?')
    statement.run(hash, id)
}

export const removeUser = function(id) {
    if (!Number.isInteger(id)) return false;
    const statement = db.prepare('DELETE FROM users WHERE id = ?')
    statement.run(id)
}

export const findUser = function(name) {
    const row = db.prepare('SELECT id FROM users WHERE name = ? LIMIT 1').get(name);
    return row ? row.id : -1;
}

export const updateFields = function(id, updates) {
    if (!Number.isInteger(id)) return
    const fields = Object.keys(updates)
    const assignments = fields.map(field => `${field} = @${field}`).join(', ')
    const statement = db.prepare(`UPDATE users SET ${assignments} WHERE id = @id`)
    statement.run({...updates, id})
}

export const isBanned = function(id) {
    if (!Number.isInteger(id)) return false
    const row = db.prepare('SELECT permission FROM users WHERE id = ? LIMIT 1').get(id)
    return row ? row.permission == 0 : false
}

export const hasGrant = function(a, b) {
    if (a == b) return true
    return isOp(b) ? isSuper(a) : isOp(a)
}

export const isOp = function(id) {
    if (!Number.isInteger(id)) return false
    const row = db.prepare('SELECT permission FROM users WHERE id = ? LIMIT 1').get(id)
    return row ? row.permission >= 2 : false
}

export const isSuper = function(id) {
    if (!Number.isInteger(id)) return false
    const row = db.prepare('SELECT permission FROM users WHERE id = ? LIMIT 1').get(id)
    return row ? row.permission == 3 : false
}

export const banUser = function(id) {
    if (!Number.isInteger(id)) return false
    updateFields(id, {permission: 0})
}

export const opUser = function(id) {
    if (!Number.isInteger(id)) return false
    updateFields(id, {permission: 2})
}

export const commUser = function(id) {
    if (!Number.isInteger(id)) return false
    updateFields(id, {permission: 1})
}

export const getCode = function(id) {
    const statement = db.prepare('SELECT invitation FROM users WHERE id = ?')
    const row = statement.get(id)
    return row ? row.invitation : 'invalid'
}

export const loginUser = async function(user, password) {
    const statement = db.prepare(`
        SELECT id, password FROM users 
        WHERE id = ? OR name = ? 
        LIMIT 1
    `)

    let parsedId = /^\d+$/.test(user) ? parseInt(user, 10) : -1
    if (isNaN(parsedId)) parsedId = -1

    const row = statement.get(parsedId, user)
    if (!row) return -1

    const ok = await argon2.verify(row.password, password)
    if (!ok) return -1

    if (!config.invite) return row.id

    const code = getCode(row.id)
    return checkCode(code) ? row.id : -1
}

export const getPublic = function(id) {
    const statement = db.prepare('SELECT id, name, nickname, bio, tag, email, phone, birth, realname, gender, job, address, url, created_at, pronoun FROM users WHERE id = ?')
    const row = statement.get(id)
    if (row) {
        let data = Object.fromEntries(Object.entries(row).filter(([_, value]) => value != null))
        if (data.nickname) {
            data.displayName = data.nickname
            data.fullName = data.nickname + ' (' + data.name + ')'
        }
        else {
            data.displayName = data.fullName = data.name
        }
        data.id = id
        return {
            success: true,
            data
        }
    }
    else return {
        success: false,
        data: {}
    }
}

export const countUser = function() {
    const row = db.prepare("SELECT seq FROM sqlite_sequence WHERE name = ?").get('users')
    return row.seq ? row.seq : 0
}

export const hasUser = function(id) {
    const statement = db.prepare('SELECT 1 FROM users WHERE id = ?')
    const row = statement.get(id)
    return !!row
}

export const closeUserDb = function() {
    if (db.open) {
        db.pragma('wal_checkpoint(FULL)')
        db.close()
    }
    console.log('Successfully closed the database user.db')
}

export const userDb = db