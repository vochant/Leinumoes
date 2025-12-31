import Router from 'express'
import { renderFile } from 'ejs'
import { config } from '../framework/config.js'
import { getPublic, updateFields, loginUser, setPassword, getVersion } from '../db/user.js'
import { getDesc, setDesc } from '../db/user_extra.js'
import { writeFileSync } from 'fs'
import { createToken } from '../util/auth.js'
import { EncodeSecurity, DecodeSecurity } from '../util/auth.js'
import { checkAndFormatPhoneNumber, checkEMail, checkURL, checkAndFormatDate } from '../util/standard.js'
import { setCSS, getCSS } from '../db/user_extra.js'
import { getBlogName, renameBlog } from '../db/blog.js'

const router = Router()

router.all(/.*/, (req, res, next) => {
    if (!req.user.logged) {
        res.redirect('/error/login_first')
        return
    }
    next()
})

router.get('/', (req, res) => {
    let desc = getDesc(req.user.id), info = getPublic(req.user.id).data
    renderFile("./src/assets/pages/settings/basic.html", { desc, info }, (_err, _hypertext) => {
        renderFile("./src/assets/layouts/layout.html", {
            page: { title: "设置" },
            config,
            user: req.user,
            content: _hypertext
        }, (err, hypertext) => {
            res.send(hypertext)
        })
    })
})

router.get('/social', (req, res) => {
    let info = getPublic(req.user.id).data
    renderFile("./src/assets/pages/settings/social.html", { user: req.user, info }, (_err, _hypertext) => {
        renderFile("./src/assets/layouts/layout.html", {
            page: { title: "设置" },
            config,
            user: req.user,
            content: _hypertext
        }, (err, hypertext) => {
            res.send(hypertext)
        })
    })
})

router.get('/blog', (req, res) => {
    let blogName = getBlogName(), stylesheet = getCSS()
    renderFile("./src/assets/pages/settings/blog.html", { user: req.user, blogName, stylesheet }, (_err, _hypertext) => {
        renderFile("./src/assets/layouts/layout.html", {
            page: { title: "设置" },
            config,
            user: req.user,
            content: _hypertext
        }, (err, hypertext) => {
            res.send(hypertext)
        })
    })
})

router.get('/security', (req, res) => {
    renderFile("./src/assets/pages/settings/security.html", { user: req.user }, (_err, _hypertext) => {
        renderFile("./src/assets/layouts/layout.html", {
            page: { title: "设置" },
            config,
            user: req.user,
            content: _hypertext
        }, (err, hypertext) => {
            res.send(hypertext)
        })
    })
})

router.post('/api_avatar', (req, res) => {
    if (!req.body || !req.body.image || typeof req.body.image !== 'string') {
        res.status(200).json({error: '需要包含图片！'})
        return
    }
    var base64Data = req.body.image.replace(/^data:image\/[\w\+]+;base64,/, "")
    try {
        var dataBuffer = Buffer.from(base64Data, 'base64')
        var flag = false
        writeFileSync(`./data/usericon/${req.user.id}.png`, dataBuffer, function(err) {
            flag = true
            if (err) {
                res.status(200).json({error: "服务器文件系统错误！"})
            } else {
                res.status(200).json({})
            }
        })
        if (!flag) {
            res.status(200).json({})            
        }
    }
    catch (err) {
        res.status(200).json({error: "无效数据！"})
    }
})

router.post('/api_css', (req, res) => {
    if (!req.body || !req.body.file || (typeof req.body.file !== 'string' && req.body.file !== null)) {
        res.status(200).json({error: '需要包含文件！'})
        return
    }
    setCSS(req.user.id, req.body.file)
    res.status(200).json({})
})

router.post('/api_blogname', (req, res) => {
    if (!req.body || !req.body.value || typeof req.body.value !== 'string' || req.body.value.length > 50) {
        res.status(200).json({error: '格式错误！'})
        return
    }
    renameBlog(req.user.id, req.body.value)
    res.status(200).json({})
})

router.post('/api', (req, res) => {
    if (!req.body || !req.body.updates || !Array.isArray(req.body.updates)) {
        res.status(200).json({error: '格式错误！'})
        return
    }
    const updates = req.body.updates
    let flag = false
    updates.forEach(v => {
        if (Object.prototype.toString.call(v) !== '[object Object]') flag = true
        else if (typeof v.id !== 'string' || typeof v.value !== 'string' || (v.value.length > 50 && v.id != 'desc') || v.value.length > 50000) flag = true
    })
    if (flag) {
        res.status(200).json({error: '格式错误！'})
        return
    }
    let directUpdates = {}
    let hasDesc = false, newDesc = ''
    updates.forEach(v => {
        if (v.value === '' && ['nickname', 'bio', 'email', 'phone', 'birth', 'realname', 'gender', 'job', 'address', 'url', 'pronoun'].includes(v.id)) {
            directUpdates[v.id] = null
        }
        else if (v.id == 'nickname' || v.id == 'bio' || v.id == 'realname' || v.id == 'gender' || v.id == 'job' || v.id == 'address' || v.id == 'pronoun') {
            directUpdates[v.id] = v.value
        }
        else if (v.id == 'tag') {
            if (req.user.op) directUpdates['tag'] = (v.value == '') ? null : v.value
            else {
                if (!flag) res.status(200).json({error: '您无权设置标签！'})
                flag = true
            }
        }
        else if (v.id == 'email') {
            if (!checkEMail(v.value)) {
                if (!flag) res.status(200).json({error: '无效的电子邮箱！'})
                flag = true
            }
            else {
                directUpdates['email'] = v.value
            }
        }
        else if (v.id == 'phone') {
            let formatted = checkAndFormatPhoneNumber(v.value)
            if (formatted == 'invalid') {
                if (!flag) res.status(200).json({error: '无效的手机号！'})
                flag = true
            }
            else {
                directUpdates['phone'] = formatted
            }
        }
        else if (v.id == 'url') {
            if (!checkURL(v.value)) {
                if (!flag) res.status(200).json({error: '无效的 URL！'})
                flag = true
            }
            else {
                directUpdates['url'] = v.value
            }
        }
        else if (v.id == 'birth') {
            let formatted = checkAndFormatDate(v.value)
            if (formatted == 'invalid') {
                if (!flag) res.status(200).json({error: '无效的出生日期！'})
                flag = true
            }
            else {
                directUpdates['birth'] = formatted
            }
        }
        else if (v.id == 'desc') {
            hasDesc = true
            newDesc = v.value
        }
    })
    if (flag) return
    if (hasDesc) setDesc(req.user.id, newDesc)
    if (Object.entries(directUpdates).length > 0) updateFields(req.user.id, directUpdates)
    res.status(200).json({})
})

router.post('/security_api', async (req, res) => {
    if (!req.body || !req.body.auth || typeof req.body.auth !== 'string') {
        res.status(200).json({error: '格式错误！'})
        return
    }
    if (await loginUser(req.user.id.toString(), req.body.auth) != req.user.id) {
        res.status(200).json({error: '原密码错误！'})
        return
    }
    if (req.body.password) {
        if (typeof req.body.password !== 'string' || req.body.password.length > 100) {
            res.status(200).json({error: '格式错误！'})
            return
        }
        if (!/^[\w!@#\$%\^&\*\(\)-\+=\[\]\{\}\\\|;:'",<\.>/\?~`]{6,}$/.test(req.body.password)) {
            res.status(200).json({error: "密码必须仅由大小写字母、数字和部分特殊符号组成，且至少为 6 位！"})
            return
        }
    }
    if (req.body.username) {
        if (typeof req.body.username !== 'string' || req.body.username.length > 50) {
            res.status(200).json({error: '格式错误！'})
            return
        }
        if (!/^\w{4,}$/.test(req.body.username)) {
            res.status(200).json({error: "用户名必须仅有大小写字母、数字和下划线组成，且至少为 4 位！"})
            return
        }
    }
    if (req.body.password) {
        await setPassword(req.user.id, req.body.password)
        let sec = JSON.parse(DecodeSecurity(req.cookies['login-cache']))
        sec.token = createToken(req.user.id, getVersion(req.user.id))
        res.cookie('login-cache', EncodeSecurity(JSON.stringify(sec)), { maxAge: 75 * 60 * 60 * 24 * 1000, httpOnly: true, sameSite: 'lax' })
    }
    if (req.body.username) updateFields(req.user.id, {name: req.body.username})
    res.status(200).json({})
})

export default router;