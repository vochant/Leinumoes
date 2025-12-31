import { createCipheriv, createDecipheriv } from 'crypto'
import { config } from '../framework/config.js'
import jwt from 'jsonwebtoken'

export const createToken = function(id, ver) {
    return jwt.sign({ id, ver }, config.key, { expiresIn: '75d' })
}

export const EncodeSecurity = function(original) {
    const cipher = createCipheriv('aes256', config.key, config.key.slice(0, 16))
    var crypted = cipher.update(original, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
}

export const DecodeSecurity = function(original) {
    const cipher = createDecipheriv('aes256', config.key, config.key.slice(0, 16))
    var data = cipher.update(original, 'hex', 'utf8');
    data += cipher.final('utf8');
    return data;
}