import { parsePhoneNumberWithError } from 'libphonenumber-js'
import validator from 'validator'
import { parse, format, isValid } from 'date-fns';

export const checkAndFormatPhoneNumber = function(number) {
    try {
        let obj = parsePhoneNumberWithError(number, {
            defaultCallingCode: '86',
            defaultCountry: 'CN'
        })
        if (typeof obj === 'string') return 'invalid'
        if (!obj || !obj.isValid()) return 'invalid'
        return obj.formatInternational()
    }
    catch (e) {
        return 'invalid'
    }
}

export const checkEMail = function(addr) {
    return validator.isEmail(addr)
}

export const checkURL = function(url) {
    try {
        const urlObject = new URL(url)
        if (urlObject.protocol !== 'https:') {
            return false
        }
        return true
    }
    catch (e) {
        return false
    }
}

export const checkAndFormatDate = function(dateString) {
    let parsedDate = null
    const possibleFormats = [
        'yyyy-MM-dd',
        'yyyy/MM/dd',
        'yyyy.MM.dd'
    ]
    for (const fmt of possibleFormats) {
        const dateAttempt = parse(dateString, fmt, new Date())
        if (isValid(dateAttempt)) {
            parsedDate = dateAttempt
            break
        }
    }
    if (!parsedDate) {
        return 'invalid'
    }
    return format(parsedDate, 'yyyy-MM-dd')
}