import { userDb } from "./user.js"

export const renameBlog = function(id, name) {
    if (!Number.isInteger(id)) return
    const statement = userDb.prepare('UPDATE users SET blogName = ? WHERE id = ?')
    statement.run(name, id)
}

export const getBlogName = function(id) {
    if (!Number.isInteger(id)) return
    const statement = userDb.prepare('SELECT blogName FROM users WHERE id = ? LIMIT 1')
    const row = statement.get(id)
    return row ? row.blogName : '[unknown]'
}