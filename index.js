import { config } from './src/framework/config.js'
import Express from 'express';
import cors from 'cors';
import BodyParser from 'body-parser';
import CookieParser from 'cookie-parser';
import { DecodeSecurity } from './src/util/auth.js';
import { isOp, getPublic, isBanned, closeUserDb, isSuper, getVersion } from './src/db/user.js';
import { closeInviteDb } from './src/db/invite.js';
import { fileURLToPath } from 'url'
import Path from 'path'
import { createServer } from 'http'
import { renderFile } from 'ejs'
import { readFileSync } from 'fs';
import { closeUserExtraDb } from './src/db/user_extra.js';
import { getPerm } from './src/db/user_extra.js';
import jwt from 'jsonwebtoken'

function verifyToken(token) {
    try {
        return jwt.verify(token, config.key)
    } catch {
        return null
    }
}

const app = Express()
app.use(cors())
app.use(BodyParser.json({limit: '32mb'}))
app.use(CookieParser())
app.use(BodyParser.urlencoded({extended: true, limit: '32mb'}))

const errids = JSON.parse(readFileSync('errids.json', 'utf-8'))

function freePath(path) {
    const fp = ['/admin', '/docs', '/report', '/file', '/usericon', '/logout', '/custom_logout', '/apple-touch-icon.png', '/favicon.ico', '/error', '/login', '/regist', '/userapi']
    let matched = false
    fp.forEach(x => { if (path.startsWith(x)) matched = true })
    return matched
}

app.use("/file", Express.static(Path.join(Path.dirname(fileURLToPath(import.meta.url)), 'web')))
app.use("/usericon", Express.static(Path.join(Path.dirname(fileURLToPath(import.meta.url)), 'data/usericon')))
app.use("/groupicon", Express.static(Path.join(Path.dirname(fileURLToPath(import.meta.url)), 'data/groupicon')))

app.get('/favicon.ico', (req, res) => {
    res.sendFile(Path.join(Path.dirname(fileURLToPath(import.meta.url)), 'web', 'favicon.ico'))
})

app.get('/apple-touch-icon.png', (req, res) => {
    res.sendFile(Path.join(Path.dirname(fileURLToPath(import.meta.url)), 'web', 'apple-touch-icon.png'))
})

app.all(/.*/, async (req, res, next) => {
    req.user = {
        logged: false,
        id: -1,
        originalId: -1,
        op: false,
        isReplace: false,
        super: false
    }
    const token = req.cookies['login-cache']
    if (token && token !== "__logout__") {
        try {
            var dec = DecodeSecurity(req.cookies["login-cache"]);
            let jso = JSON.parse(dec)
            if (jso.token && typeof jso.token === 'string') {
                const data = verifyToken(jso.token)
                if (data && data.id && typeof data.ver !== 'undefined' && data.ver == getVersion(data.id)) req.user.id = data.id
                if (!getPerm(req.user.id, 'login')) req.user.id = -1
                if (req.user.id != -1) {
                    req.user.logged = true
                    req.user.originalId = req.user.id
                    req.user.op = isOp(req.user.id)
                    if (req.user.op) {
                        req.user.super = isSuper(req.user.id)
                        if (jso.replace) {
                            let repl = /^\d+$/.test(jso.replace) ? parseInt(jso.replace, 10) : -1
                            if (repl != -1 && repl != req.user.id && (!isOp(repl) || req.user.super)) {
                                req.user.isReplace = true
                                req.user.id = repl
                            }
                        }
                    }
                }
            }
        }
        catch (err) {}
    }
    if (req.user.id) {
        let pub = getPublic(req.user.id)
        if (pub.success) {
            if (pub.data.nickname) req.user.name = pub.data.nickname
            else if (pub.data.name) req.user.name = pub.data.name
            else req.user.name = '[unknown]'
        }
        else req.user.name = '[unknown]'
    }
    else req.user.name = '未登录'
    if (isBanned(req.user.id) && !freePath(req._parsedUrl.pathname)) {
        renderFile("./src/assets/pages/banned.html", {}, (_err, _hypertext) => {
            renderFile("./src/assets/layouts/layout.html", {
                page: { title: "您已被封禁" },
                config,
                user: req.user,
                content: _hypertext
            }, (err, hypertext) => {
                res.send(hypertext)
            })
        })
        return
    }
    next()
})

import LoginHandler from './src/handlers/login_handler.js'
import DocumentHandler from './src/handlers/document_handler.js'
import AdminHandler from './src/handlers/admin_handler.js'
import UserHandler from './src/handlers/user_handler.js'
import SettingsHandler from './src/handlers/settings_handler.js'
import ArticleHandler from './src/handlers/article_handler.js'

app.use('/', LoginHandler)
app.use('/docs', DocumentHandler)
app.use('/admin', AdminHandler)
app.use('/user', UserHandler)
app.use('/settings', SettingsHandler)
app.use('/articles/', ArticleHandler)

app.get('/error/:eid', (req, res) => {
    renderFile("./src/assets/layouts/layout.html", {
        page: { title: "错误" },
        config,
        user: req.user,
        content: `<script>function SetText(str){$("#out").text(str+" 秒后将自动返回主页")}setTimeout(SetText,1000,2);setTimeout(SetText,2000,1);setTimeout(()=>{location.href=location.origin;},3000);</script><div class="mdui-typo">${errids[req.params.eid] ? errids[req.params.eid] : "未定义的错误"}<br><div id="out">3 秒后将自动返回主页</div></div>`
    }, (err, hypertext) => {
        res.send(hypertext)
    })
})

app.get(/.*/, (req, res) => {
    renderFile("./src/assets/pages/404.html", {}, (_err, _hypertext) => {
        renderFile("./src/assets/layouts/layout.html", {
            page: { title: "404 Not Found" },
            config,
            user: req.user,
            content: _hypertext
        }, (err, hypertext) => {
            res.status(404).send(hypertext)
        })
    })
})

app.use((err, req, res, next) => {
    console.error(err.stack)

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        res.status(500).json({ error: '服务器内部错误' })
    } else {
        res.status(500).send('<!DOCTYPE html><html><head><title>We\'re sorry, but something went wrong (500)</title><style type="text/css">body{background-color:#fff;color:#666;text-align:center;font-family:arial,sans-serif;}div.dialog{width:25em;padding:0 4em;margin:4em auto 0 auto;border:1px solid #ccc;border-right-color:#999;border-bottom-color:#999;}h1{ font-size:100%;color:#f00;line-height:1.5em;}</style></head><body><div class="dialog"><h1>We\'re sorry, but something went wrong.</h1><p>We\'ve been notified about this issue and we\'ll take a look at it shortly.</p></div></body></html>')
    }
})

const server = createServer(app)

server.listen(config.port, () => {
    console.log(`Port :${config.port} is opened`)
})

let shutdownExecuted = false

function registerShutdownHooks() {
    ['SIGINT', 'SIGTERM', 'beforeExit', 'exit'].forEach(evt => {
        process.on(evt, () => {
            if (shutdownExecuted) return
            shutdownExecuted = true

            closeUserDb()
            closeInviteDb()
            closeUserExtraDb()

            if (evt !== 'exit' && evt !== 'beforeExit') process.exit(0)
        })
    })
}

registerShutdownHooks()