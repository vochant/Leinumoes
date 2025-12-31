import sqlite3 from 'better-sqlite3';
import { config } from '../framework/config.js';
import { v4 as uuidv4, validate as uuidvalidate } from 'uuid'

const db = config.invite ? sqlite3('invite.db') : null
if (config.invite) {
    db.pragma('journal_mode = WAL')
    db.exec(`
        CREATE TABLE IF NOT EXISTS invite (
            code TEXT PRIMARY KEY,
            remain INTEGER NOT NULL,
            banned INTEGER NOT NULL
        )
    `)
}

export const createCode = function(num) {
    if (!config.invite) return null
    if (!Number.isInteger(num) || num <= 0) return null
    const statement = db.prepare('INSERT INTO invite (code, remain, banned) VALUES (?, ?, 0)')
    let code = uuidv4()
    statement.run(code, num)
    return code
}

export const banCode = function(code) {
    if (!config.invite) return
    if (!uuidvalidate(code)) return
    const statement = db.prepare('UPDATE invite SET banned = 1 WHERE code = ?')
    statement.run(code)
}

export const pardonCode = function(code) {
    if (!config.invite) return
    if (!uuidvalidate(code)) return
    const statement = db.prepare('UPDATE invite SET banned = 0 WHERE code = ?')
    statement.run(code)
}

export const remainCode = function(code) {
    if (!config.invite) return null
    if (!uuidvalidate(code)) return false
    const statement = db.prepare('SELECT remain FROM invite WHERE code = ? AND banned = 0')
    const row = statement.get(code)
    return row ? (row.remain > 0) : false
}

export const useCode = function(code) {
    if (!config.invite) return false
    if (!uuidvalidate(code)) return false
    const statement = db.prepare('UPDATE invite SET remain = remain - 1 WHERE code = ? AND banned = 0 AND remain > 0')
    const result = statement.run(code)
    return result.changes > 0
}

export const tryUseCode = function(code) {
  if (!config.invite) return false
  if (!uuidvalidate(code)) return false
  const statement = db.prepare(`UPDATE invite SET remain = remain - 1 WHERE code = ? AND banned = 0 AND remain > 0`)
  const result = statement.run(code)
  return result.changes > 0
}

export const checkCode = function(code) {
    if (!config.invite) return true
    if (code == "[[disabled]]") return true
    if (!uuidvalidate(code)) return false
    const statement = db.prepare('SELECT banned FROM invite WHERE code = ? AND banned = 0')
    const row = statement.get(code)
    return !!row
}

export const closeInviteDb = function() {
    if (!config.invite) return
    if (db.open) {
        db.pragma('wal_checkpoint(FULL)')
        db.close()
    }
    console.log('Successfully closed the database invite.db')
}