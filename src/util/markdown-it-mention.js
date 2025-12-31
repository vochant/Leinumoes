import { findUser } from '../db/user.js'

export const markdownItMention = function(md) {
  const mentionRegex = /^@(\w+)/

  function mentionRule(state, silent) {
    const pos = state.pos
    const src = state.src
    if (src[pos] !== '@') return false
    const match = mentionRegex.exec(src.slice(pos))
    if (!match) return false
    const username = match[1]
    if (silent) return false
    const mentionText = `@${username}`
    const uid = findUser(username)
    if (uid != -1) {
        const tokenOpen = state.push('link_open', 'a', 1)
        tokenOpen.attrs = [['href', `/user/${uid}`]]
        const textToken = state.push('text', '', 0)
        textToken.content = mentionText
        state.push('link_close', 'a', -1)
    }
    else {
        const textToken = state.push('text', '', 0)
        textToken.content = mentionText
    }
    state.pos += match[0].length
    return true
  }

  md.inline.ruler.before('emphasis', 'mention', mentionRule)
}