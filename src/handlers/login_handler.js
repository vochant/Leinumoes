import Router from 'express'
import { renderFile } from 'ejs'
import Identicon from 'identicon.js'
import { EncodeSecurity, DecodeSecurity, createToken } from '../util/auth.js'
import { config } from '../framework/config.js'
import { loginUser, createUser, findUser, getVersion } from '../db/user.js'
import { createUserExtra } from '../db/user_extra.js'
import { tryUseCode } from '../db/invite.js'
import { writeFileSync } from 'fs'
import { createHash } from 'crypto';

const router = Router();

router.get('/logout', (req, res) => {
	if (!req.user.logged) {
        res.redirect('/error/login_first')
        return
    }
    res.cookie("login-cache", "__logout__", { maxAge: 0, httpOnly: true, sameSite: 'lax' })
    let backURL = req.header('Referer') || '/'
	res.redirect(backURL)
})

router.get('/custom_logout', (req, res) => {
    if (req.user.isReplace) {
        let jso = JSON.parse(DecodeSecurity(req.cookies["login-cache"]));
        res.cookie("login-cache", EncodeSecurity(JSON.stringify({
            token: jso.token
        })), { maxAge: 75 * 60 * 60 * 24 * 1000, httpOnly: true, sameSite: 'lax' })
    }
    let backURL = req.header('Referer') || '/'
	res.redirect(backURL)
})

router.get('/login', (req, res) => {
    if (req.user.logged) {
		res.redirect('/error/logout_first')
        return
	}
    renderFile("./src/assets/pages/login.html", {}, (_err, _hypertext) => {
        renderFile("./src/assets/layouts/layout.html", {
            page: { title: "登录" },
            config,
            user: req.user,
            content: _hypertext
        }, (err, hypertext) => {
            res.send(hypertext)
        })
    })
})

router.get('/regist', (req, res) => {
    if (req.user.logged) {
		res.redirect('/error/logout_first')
        return
	}
    renderFile("./src/assets/pages/regist.html", { config }, (_err, _hypertext) => {
        renderFile("./src/assets/layouts/layout.html", {
            page: { title: "注册" },
            config,
            user: req.user,
            content: _hypertext
        }, (err, hypertext) => {
            res.send(hypertext)
        })
    })
})

router.post('/userapi', async (req, res) => {
    const obj = req.body
    if (!obj.method || typeof obj.method !== "string") {
		res.status(200).json({error: "需要提供一个方法！"})
		return
	}
    if (req.user.logged) {
        res.status(200).json({error: "已经登录，无需再次注册/登录！"})
		return
    }
    if (!obj.user || typeof obj.user !== 'string' || !obj.passwd || typeof obj.passwd !== 'string' || obj.passwd.length > 100 || obj.user.length > 50) {
        res.status(200).json({error: "错误的格式！"})
        return
    }
    if (!/^[\w!@#\$%\^&\*\(\)-\+=\[\]\{\}\\\|;:'",<\.>/\?~`]{6,}$/.test(obj.passwd)) {
        res.status(200).json({error: "密码必须仅由大小写字母、数字和部分特殊符号组成，且至少为 6 位！"})
        return
    }
    if (obj.method === 'login') {
        if (!/^\w{4,}$/.test(obj.user) && !/^\d+$/.test(obj.user)) {
            res.status(200).json({error: "用户名必须仅有大小写字母、数字和下划线组成，且至少为 4 位！"})
            return
        }
        let id = await loginUser(obj.user, obj.passwd)
        if (id == -1) {
            res.status(200).json({error: "用户名或密码错误！"})
            return
        }
        res.cookie("login-cache", EncodeSecurity(JSON.stringify({
            token: createToken(id, getVersion(id))
        })), { maxAge: 75 * 60 * 60 * 24 * 1000, httpOnly: true, sameSite: 'lax' })
        res.status(200).json({})
    }
    else if (obj.method === 'regist') {
        let inv = "[[disabled]]"
        if (findUser(obj.user) != -1) {
            res.status(200).json({error: "用户名已被占用！"})
			return
        }
        if (!/^\w{4,}$/.test(obj.user)) {
            res.status(200).json({error: "用户名必须仅有大小写字母、数字和下划线组成，且至少为 4 位！"})
            return
        }
        if (/^\d+$/.test(obj.user)) {
            res.status(200).json({error: "用户名不能为纯数字！"})
			return
        }
        if (config.invite) {
            if (!obj.invite || typeof obj.invite !== 'string') {
                res.status(200).json({error: "缺少邀请码！"})
                return
            }
            if (!tryUseCode(obj.invite)) {
                res.status(200).json({error: "邀请码无效或已用尽！"})
                return
            }
            inv = obj.invite
        }
        let uid = await createUser(obj.user, obj.passwd, inv)
        const MD5 = createHash("md5")
        MD5.update(obj.user)
        let img = new Identicon(MD5.digest('hex')).toString()
        var dataBuffer = Buffer.from(img, 'base64')
        writeFileSync(`./data/usericon/${uid}.png`, dataBuffer)
        createUserExtra(uid)
        res.cookie("login-cache", EncodeSecurity(JSON.stringify({
            token: createToken(uid, 0)
        })), { maxAge: 75 * 60 * 60 * 24 * 1000, httpOnly: true, sameSite: 'lax' })
        res.status(200).json({})
    }
    else {
        res.status(200).json({error: "未知的方法！"})
    }
})

export default router