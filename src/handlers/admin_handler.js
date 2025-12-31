import Router from 'express'
import { renderFile } from 'ejs'
import { config } from '../framework/config.js'
import { v4 as uuidv4 } from 'uuid'
import { isOp, hasUser } from '../db/user.js'
import { EncodeSecurity, DecodeSecurity } from '../util/auth.js'

const router = Router()

router.all(/.*/, (req, res, next) => {
    if (!req.user.op) {
        res.redirect('/error/no_op')
        return
    }
    next()
})

router.get('/', (req, res) => {
    renderFile("./src/assets/pages/admin/index.html", { user: req.user }, (_err, _hypertext) => {
        renderFile("./src/assets/partial/admin.html", { config }, (_err2, _hypertext2) => {
            renderFile("./src/assets/layouts/layout.html", {
                page: { title: "后台管理" },
                config,
                user: req.user,
                content: _hypertext,
                drawer: _hypertext2
            }, (err, hypertext) => {
                res.send(hypertext)
            })
        })
    })
})

router.post('/custom_login', (req, res) => {
    const obj = req.body
    if (!obj.user || typeof obj.user !== 'string' || !/^\d+$/.test(obj.user)) {
        res.status(200).json({error: "格式错误！"})
        return
    }
    const uid = parseInt(obj.user)
    if (!hasUser(uid)) {
        res.status(200).json({error: "该用户不存在！"})
        return
    }
    if (uid === req.user.id || (isOp(uid) && !isSuper(req.user.id))) {
        res.status(200).json({error: "无权访问该用户！"})
        return
    }
    const jso = JSON.parse(DecodeSecurity(req.cookies["login-cache"]))
    res.cookie("login-cache", EncodeSecurity(JSON.stringify({
        token: jso.token,
        replace: obj.user
    })), { maxAge: 75 * 60 * 60 * 24 * 1000, httpOnly: true, sameSite: 'lax' })
    res.status(200).json({})
})



export default router