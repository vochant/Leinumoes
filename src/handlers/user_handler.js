import Router from 'express'
import { renderFile } from 'ejs'
import { config } from '../framework/config.js'
import { getPublic, hasUser } from '../db/user.js'
import { getDesc, countFollower, countFollowing, follow, unfollow, block, unblock, listFollower, listFollowing, isFollowed, isBlocked, getPerm } from '../db/user_extra.js'
import { countArticlesByUser, getArticlesByUser } from '../db/article.js'
import markdown from '../util/markdown.js'

const router = Router()

router.post('/api', (req, res) => {
    const obj = req.body
    if (!obj.method || typeof obj.method !== "string") {
		res.status(200).json({error: "需要提供一个方法！"})
		return
	}
    if (!req.user.logged) {
        res.status(200).json({error: "请先登录！"})
		return
    }
    if (!obj.user || typeof obj.user !== 'string' || !/^\d*$/.test(obj.user)) {
        res.status(200).json({error: "需要提供一个目标用户！"})
    }
    const uid = parseInt(obj.user)
    if (obj.method === 'follow') { res.status(200).json(follow(req.user.id, uid)) }
    else if (obj.method === 'unfollow') { res.status(200).json(unfollow(req.user.id, uid)) }
    else if (obj.method === 'block') { res.status(200).json(block(req.user.id, uid)) }
    else if (obj.method === 'unblock') { res.status(200).json(unblock(req.user.id, uid)) }
    else { res.status(200).json({error: "不存在的方法！"}) }
})

router.get('/:uid', (req, res) => {
    if (!/^\d+$/.test(req.params.uid) || !hasUser(parseInt(req.params.uid))) {
        res.redirect('/error/invalid_user')
        return
    }
    const uid = parseInt(req.params.uid);
    const info = getPublic(uid).data
    const desc = getDesc(uid)
    const helper = {
        countFollower,
        countFollowing,
        isFollowed,
        isBlocked
    }
    renderFile("./src/assets/pages/person/intro.html", { info, desc, markdown }, (_err, _hypertext) => {
        renderFile("./src/assets/pages/person/frame.html", { info, user: req.user, helper, page: _hypertext }, (_err2, _hypertext2) => {
            renderFile("./src/assets/layouts/layout.html", {
                page: { title: info.displayName + "的个人主页" },
                config,
                user: req.user,
                content: _hypertext2
            }, (err, hypertext) => {
                res.send(hypertext)
            })
        })
    })
})

router.get('/:uid/articles', (req, res) => {
    if (!/^\d+$/.test(req.params.uid) || !hasUser(parseInt(req.params.uid))) {
        res.redirect('/error/invalid_user')
        return
    }
    const uid = parseInt(req.params.uid);
    const info = getPublic(uid).data
    const helper = {
        countFollower,
        countFollowing,
        isFollowed,
        isBlocked
    }
    let muted = !req.user.logged || !getPerm(req.user.id, 'post')
    let articles = countArticlesByUser(uid), pages = Math.max(1, Math.ceil(articles / 20))
    let page
    if (req.query.page) {
        if (typeof req.query.page !== 'string' || !/^\d+$/.test(req.query.page)) {
            res.redirect(`/div/${did}`)
            return
        }
        page = parseInt(req.query.page)
        if (page < 1) {
            res.redirect(`/div/${did}`)
            return
        }
        if (page > pages) {
            res.redirect(`/div/${did}?page=${pages}`)
            return
        }
    }
    else page = 1
    let currentPage = getArticlesByUser(uid, page)
    renderFile("./src/assets/pages/person/articles.html", { uid, page, currentPage, info, muted, articles, user: req.user }, (_err, _hypertext) => {
        renderFile("./src/assets/pages/person/frame.html", { info, user: req.user, helper, page: _hypertext }, (_err2, _hypertext2) => {
            renderFile("./src/assets/layouts/layout.html", {
                page: { title: info.displayName + "的文章" },
                config,
                user: req.user,
                content: _hypertext2
            }, (err, hypertext) => {
                res.send(hypertext)
            })
        })
    })
})

router.get('/:uid/activities', (req, res) => {
    if (!/^\d+$/.test(req.params.uid) || !hasUser(parseInt(req.params.uid))) {
        res.redirect('/error/invalid_user')
        return
    }
    const uid = parseInt(req.params.uid);
    const info = getPublic(uid).data
    const helper = {
        countFollower,
        countFollowing,
        isFollowed,
        isBlocked
    }
    renderFile("./src/assets/pages/person/activities.html", { uid }, (_err, _hypertext) => {
        renderFile("./src/assets/pages/person/frame.html", { info, user: req.user, helper, page: _hypertext }, (_err2, _hypertext2) => {
            renderFile("./src/assets/layouts/layout.html", {
                page: { title: info.displayName + "的动态" },
                config,
                user: req.user,
                content: _hypertext2
            }, (err, hypertext) => {
                res.send(hypertext)
            })
        })
    })
})

router.get('/:uid/follower', (req, res) => {
    if (!/^\d+$/.test(req.params.uid) || !hasUser(parseInt(req.params.uid))) {
        res.redirect('/error/invalid_user')
        return
    }
    const uid = parseInt(req.params.uid)
    res.redirect(`/user/${uid}/follower/1`)
})

router.get('/:uid/follower/:page', (req, res) => {
    if (!/^\d+$/.test(req.params.uid) || !hasUser(parseInt(req.params.uid))) {
        res.redirect('/error/invalid_user')
        return
    }
    const uid = parseInt(req.params.uid)
    if (!/^\d+$/.test(req.params.page) || !hasUser(parseInt(req.params.page))) {
        res.redirect(`/user/${uid}/follower/1`)
        return
    }
    const page = parseInt(req.params.page)
    const info = getPublic(uid).data
    const helper = {
        countFollower,
        countFollowing,
        isFollowed,
        isBlocked
    }
    const pages = Math.max(Math.ceil(countFollower(uid) / 20), 1)
    if (page < 1) {
        res.redirect(`/user/${uid}/follower/1`)
        return
    }
    if (page > pages) {
        res.redirect(`/user/${uid}/follower/${pages}`)
        return
    }
    renderFile("./src/assets/pages/person/list.html", { uid, user: req.user, page, pages, getItems: listFollower, getPublic, helper }, (_err, _hypertext) => {
        renderFile("./src/assets/pages/person/frame.html", { info, user: req.user, helper, page: _hypertext }, (_err2, _hypertext2) => {
            renderFile("./src/assets/layouts/layout.html", {
                page: { title: info.displayName + "的粉丝" },
                config,
                user: req.user,
                content: _hypertext2
            }, (err, hypertext) => {
                res.send(hypertext)
            })
        })
    })
})

router.get('/:uid/following', (req, res) => {
    if (!/^\d+$/.test(req.params.uid) || !hasUser(parseInt(req.params.uid))) {
        res.redirect('/error/invalid_user')
        return
    }
    const uid = parseInt(req.params.uid)
    res.redirect(`/user/${uid}/following/1`)
})

router.get('/:uid/following/:page', (req, res) => {
    if (!/^\d+$/.test(req.params.uid) || !hasUser(parseInt(req.params.uid))) {
        res.redirect('/error/invalid_user')
        return
    }
    const uid = parseInt(req.params.uid)
    if (!/^\d+$/.test(req.params.page) || !hasUser(parseInt(req.params.page))) {
        res.redirect(`/user/${uid}/following/1`)
        return
    }
    const page = parseInt(req.params.page)
    const info = getPublic(uid).data
    const helper = {
        countFollower,
        countFollowing,
        isFollowed,
        isBlocked
    }
    const pages = Math.max(Math.ceil(countFollowing(uid) / 20), 1)
    if (page < 1) {
        res.redirect(`/user/${uid}/following/1`)
        return
    }
    if (page > pages) {
        res.redirect(`/user/${uid}/following/${pages}`)
        return
    }
    renderFile("./src/assets/pages/person/list.html", { uid, user: req.user, page, pages, getItems: listFollowing, getPublic, helper }, (_err, _hypertext) => {
        renderFile("./src/assets/pages/person/frame.html", { info, user: req.user, helper, page: _hypertext }, (_err2, _hypertext2) => {
            renderFile("./src/assets/layouts/layout.html", {
                page: { title: info.displayName + "的关注" },
                config,
                user: req.user,
                content: _hypertext2
            }, (err, hypertext) => {
                res.send(hypertext)
            })
        })
    })
})

export default router