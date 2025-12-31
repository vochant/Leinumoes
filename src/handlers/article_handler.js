import Router from 'express'
import { renderFile } from 'ejs'
import { config } from '../framework/config.js'
import { isFollowed, getPerm, isBlocked } from '../db/user_extra.js'
import { hasGrant} from '../db/user.js'
import markdown from '../util/markdown.js'
import { countArticles, checkCommGrant, floorToPage, createComment, removeComment, removeArticle, getVote, changeVote, modifyArticle, createArticle, countPinned, getDivide, getArticles, getArticlesByUser, getArticle, getComments, getPinned, countComments, countArticlesByUser, getDivides, findDivide, createDivide, hasDivide, setAnnouncement, renameDivide, removeDivide, descDivide, getArticlesByDivide, countArticlesByDivide } from '../db/article.js'

const router = Router()

router.get('/', (req, res) => {
    let anns = []
    if (config.announcement) anns = getArticlesByDivide(config.announcement, 1)
    let pins = getPinned(1)
    let lats = getArticles(1)
    let divs = getDivides()
    renderFile("./src/assets/pages/article/index.html", { divs, anns, pins, config, lats }, (_err, _hypertext) => {
        renderFile("./src/assets/layouts/layout.html", {
            page: { title: '论坛' },
            config,
            user: req.user,
            content: _hypertext
        }, (err, hypertext) => {
            res.send(hypertext)
        })
    })
})

router.get('/div/manage', (req, res) => {
    if (!req.user.logged) {
        res.redirect('/error/login_first')
        return
    }
    if (!req.user.op) {
        res.redirect('/error/no_op')
        return
    }
    let ds = getDivides()
    renderFile("./src/assets/pages/article/divides_manage.html", { divides: ds }, (_err, _hypertext) => {
        renderFile("./src/assets/layouts/layout.html", {
            page: { title: '管理分类' },
            config,
            user: req.user,
            content: _hypertext
        }, (err, hypertext) => {
            res.send(hypertext)
        })
    })
})

router.post('/div/api', (req, res) => {
    if (!req.user.logged) {
        res.status(200).json({error: '未登录'})
        return
    }
    if (!req.user.op) {
        res.status(200).json({error: '您无权执行该操作'})
        return
    }
    const obj = req.body
    if (!obj.method || typeof obj.method !== "string") {
		res.status(200).json({error: "需要提供一个方法！"})
		return
	}
    if (obj.method === 'create') {
        if (!obj.name || typeof obj.name !== 'string' || obj.name === '') {
            res.status(200).json({error: '需要提供一个名称'})
            return
        }
        if (findDivide(obj.name)) {
            res.status(200).json({error: '该名称已经存在，不得重复'})
            return
        }
        res.status(200).json({id: createDivide(obj.name)})
        return
    }
    if (!obj.id || typeof obj.id !== 'string' || !/^\d+$/.test(obj.id)) {
        res.status(200).json({error: '需要提供一个编号'})
        return
    }
    let id = parseInt(obj.id)
    if (!hasDivide(id)) {
        res.status(200).json({error: '分类无效'})
        return
    }
    if (obj.method === 'desc') {
        if (typeof obj.desc !== 'string') {
            res.status(200).json({error: '需要提供一个描述'})
            return
        }
        descDivide(id, obj.desc)
        res.status(200).json({})
    }
    else if (obj.method === 'announcement') {
        if (!obj.announcement || typeof obj.announcement !== 'string' || !/^[01]$/.test(obj.announcement)) {
            res.status(200).json({error: '需要提供 announcement 参数且为 0 或 1'})
            return
        }
        setAnnouncement(id, 0 + (obj.announcement === '1'))
        res.status(200).json({})
    }
    else if (obj.method === 'rename') {
        if (!obj.name || typeof obj.name !== 'string' || obj.name === '') {
            res.status(200).json({error: '需要提供一个名称'})
            return
        }
        if (findDivide(obj.name)) {
            res.status(200).json({error: '该名称重复或未更改'})
            return
        }
        renameDivide(id, obj.name)
        res.status(200).json({})
    }
    else if (obj.method === 'remove') {
        if (id === 1) {
            res.status(200).json({error: '不得删除默认分区'})
            return
        }
        removeDivide(id)
        res.status(200).json({})
    }
    else {
        res.status(200).json({error: '未知操作'})
    }
})

router.get('/pinned', (req, res) => {
    let articles = countPinned(), pages = Math.max(1, Math.ceil(articles / 20))
    let page
    if (req.query.page) {
        if (typeof req.query.page !== 'string' || !/^\d+$/.test(req.query.page)) {
            res.redirect('/articles/pinned')
            return
        }
        page = parseInt(req.query.page)
        if (page < 1) {
            res.redirect('/articles/pinned')
            return
        }
        if (page > pages) {
            res.redirect(`/articles/pinned?page=${pages}`)
            return
        }
    }
    else page = 1
    let currentPage = getPinned(page)
    renderFile("./src/assets/pages/article/pinned.html", { currentPage, page, articles }, (_err, _hypertext) => {
        renderFile("./src/assets/layouts/layout.html", {
            page: { title: '置顶讨论' },
            config,
            user: req.user,
            content: _hypertext
        }, (err, hypertext) => {
            res.send(hypertext)
        })
    })
})

router.get('/div/:did', (req, res) => {
    if (!req.params.did || typeof req.params.did !== 'string' || !/^\d+$/.test(req.params.did)) {
        res.redirect('/error/not_found')
        return
    }
    let did = parseInt(req.params.did)
    if (!hasDivide(did)) {
        res.redirect('/error/not_found')
        return
    }
    let div = getDivide(did)
    if (!div) {
        res.redirect('/error/not_found')
        return
    }
    let muted = !req.user.logged || !getPerm(req.user.id, 'post')
    let articles = countArticlesByDivide(did), pages = Math.max(1, Math.ceil(articles / 20))
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
    let currentPage = getArticlesByDivide(did, page)
    renderFile("./src/assets/pages/article/divide.html", { articles, div, muted, currentPage, page, user: req.user }, (_err, _hypertext) => {
        renderFile("./src/assets/layouts/layout.html", {
            page: { title: div.name },
            config,
            user: req.user,
            content: _hypertext
        }, (err, hypertext) => {
            res.send(hypertext)
        })
    })
})

router.get('/all', (req, res) => {
    let muted = !req.user.logged || !getPerm(req.user.id, 'post')
    let articles = countArticles(), pages = Math.max(1, Math.ceil(articles / 20))
    let page
    if (req.query.page) {
        if (typeof req.query.page !== 'string' || !/^\d+$/.test(req.query.page)) {
            res.redirect(`/all`)
            return
        }
        page = parseInt(req.query.page)
        if (page < 1) {
            res.redirect(`/all`)
            return
        }
        if (page > pages) {
            res.redirect(`/all?page=${pages}`)
            return
        }
    }
    else page = 1
    let currentPage = getArticles(page)
    renderFile("./src/assets/pages/article/all.html", { articles, muted, currentPage, page, user: req.user }, (_err, _hypertext) => {
        renderFile("./src/assets/layouts/layout.html", {
            page: { title: "全部文章" },
            config,
            user: req.user,
            content: _hypertext
        }, (err, hypertext) => {
            res.send(hypertext)
        })
    })
})

router.get('/manage', (req, res) => {
    if (!req.user.logged) {
        res.redirect('/error/login_first')
        return
    }
    if (!req.query.user || typeof req.query.user !== 'string' || !/^\d+$/.test(req.query.user)) {
        res.redirect('/error/not_found')
        return
    }
    let managed_user = parseInt(req.query.user)
    if (!hasGrant(req.user.id, managed_user)) {
        res.redirect('/error/permission_denied')
        return
    }
    let articles = countArticlesByUser(managed_user), pages = Math.max(1, Math.ceil(articles / 20))
    let page = 1
    if (req.query.page) {
        if (typeof req.query.page !== 'string' || !/^\d+$/.test(req.query.page)) {
            res.redirect(`manage?user=${managed_user}&page=1`)
            return
        }
        page = parseInt(req.query.page)
        if (page < 1) {
            res.redirect(`manage?user=${managed_user}&page=1`)
            return
        }
        if (page > pages) {
            res.redirect(`manage?user=${managed_user}&page=${pages}`)
            return
        }
    }
    let currentPage = getArticlesByUser(managed_user, page)
    renderFile("./src/assets/pages/article/manage.html", { articles, currentPage, page, managed_user, user: req.user }, (_err, _hypertext) => {
        renderFile("./src/assets/layouts/layout.html", {
            page: { title: '管理文章' },
            config,
            user: req.user,
            content: _hypertext
        }, (err, hypertext) => {
            res.send(hypertext)
        })
    })
})

router.get('/new', (req, res) => {
    if (!req.user.logged) {
        res.redirect('/error/login_first')
        return
    }
    let div
    if (req.query.div && typeof req.query.div === 'string' && /^\d+$/.test(req.query.div)) {
        let did = parseInt(req.query.div)
        if (hasDivide(did)) {
            div = getDivide(did)
        }
        else {
            res.redirect('/error/not_found')
            return
        }
    }
    else {
        div = getDivide(1)
    }
    if (!div) {
        res.redirect('/error/not_found')
        return
    }
    if (div.announcement && !req.user.op) {
        res.redirect('/error/permission_denied')
        return
    }
    renderFile("./src/assets/pages/article/create_or_modify.html", { isModify: false, div }, (_err, _hypertext) => {
        renderFile("./src/assets/layouts/layout.html", {
            page: { title: '创建文章' },
            config,
            user: req.user,
            content: _hypertext
        }, (err, hypertext) => {
            res.send(hypertext)
        })
    })
})

router.post('/api', (req, res) => {
    if (!req.user.logged) {
        res.status(200).json({error: '未登录'})
        return
    }
    if (!req.body.method || typeof req.body.method !== 'string') {
        res.status(200).json({error: '需要提供一个方法'})
        return
    }
    if (!getPerm(req.user.id, 'post')) {
        res.status(200).json({error: '您没有权限发布文章'})
        return
    }
    if (req.body.method === 'create') {
        if (!req.body.title || typeof req.body.title !== 'string' || req.body.title === '') {
            res.status(200).json({error: '需要提供一个标题'})
            return
        }
        if (!req.body.content || typeof req.body.content !== 'string' || req.body.content === '') {
            res.status(200).json({error: '需要提供内容'})
            return
        }
        if (!req.body.divide || typeof req.body.divide !== 'string' || !/^\d+$/.test(req.body.divide)) {
            res.status(200).json({error: '需要提供一个分区'})
            return
        }
        let did = parseInt(req.body.divide)
        let div = getDivide(did)
        if (!div) {
            res.status(200).json({error: '分区无效'})
            return
        }
        if (div.announcement && !req.user.op) {
            res.status(200).json({error: '您没有权限在该分区发布文章'})
            return
        }
        let aid = createArticle(req.user.id, req.body.title, req.body.content, did)
        res.status(200).json({id: aid})
    }
    else if (req.body.method === 'modify') {
        if (!req.body.id || typeof req.body.id !== 'string' || !/^\d+$/.test(req.body.id)) {
            res.status(200).json({error: '需要提供一个文章编号'})
            return
        }
        if (!req.body.content || typeof req.body.content !== 'string' || req.body.content === '') {
            res.status(200).json({error: '需要提供内容'})
            return
        }
        if (!req.body.div || typeof req.body.div !== 'string' || !/^\d+$/.test(req.body.div)) {
            res.status(200).json({error: '需要提供一个分区'})
            return
        }
        let aid = parseInt(req.body.id)
        let art = getArticle(aid)
        if (art.invalid) {
            res.status(200).json({error: '文章无效'})
            return
        }
        if (!hasGrant(req.user.id, art.user)) {
            res.status(200).json({error: '您没有权限修改该文章'})
            return
        }
        modifyArticle(art.id, req.body.title, req.body.content)
        res.status(200).json({id: art.id})
    }
    else if (req.body.method === 'delete') {
        if (!req.body.id || typeof req.body.id !== 'string' || !/^\d+$/.test(req.body.id)) {
            res.status(200).json({error: '需要提供一个文章编号'})
            return
        }
        let aid = parseInt(req.body.id)
        let art = getArticle(aid)
        if (art.invalid) {
            res.status(200).json({error: '文章无效'})
            return
        }
        if (!hasGrant(req.user.id, art.user)) {
            res.status(200).json({error: '您没有权限删除该文章'})
            return
        }
        removeArticle(art.id)
        res.status(200).json({})
    }
    else {
        res.status(200).json({error: '未知操作'})
    }
})

router.post('/api_vote', (req, res) => {
    if (!req.user.logged) {
        res.status(200).json({error: '未登录'})
        return
    }
    if (!req.body.aid || typeof req.body.aid !== 'string' || !/^\d+$/.test(req.body.aid)) {
        res.status(200).json({error: '需要提供一个文章编号'})
        return
    }
    let aid = parseInt(req.body.aid)
    let art = getArticle(aid)
    if (art.invalid) {
        res.status(200).json({error: '文章无效'})
        return
    }
    if (isBlocked(art.author, req.user.id)) {
        res.status(200).json({error: '您无权投票'})
        return
    }
    if (!req.body.vote || typeof req.body.vote !== 'string' || !['1', '0', '-1'].includes(req.body.vote)) {
        res.status(200).json({error: '无效投票信息'})
        return
    }
    changeVote(req.user.id, aid, parseInt(req.body.vote))
    res.status(200).json({})
})

router.post('/api_comment', (req, res) => {
    if (!req.user.logged) {
        res.status(200).json({error: '未登录'})
        return
    }
    if (!req.body.aid || typeof req.body.aid !== 'string' || !/^\d+$/.test(req.body.aid)) {
        res.status(200).json({error: '需要提供一个文章编号'})
        return
    }
    if (!req.body.content || typeof req.body.content !== 'string' || req.body.content == '') {
        res.status(200).json({error: '需要提供一段评论内容'})
        return
    }
    let aid = parseInt(req.body.aid)
    let art = getArticle(aid)
    if (art.invalid) {
        res.status(200).json({error: '文章无效'})
        return
    }
    let reply = null
    if (req.body.reply) {
        if (typeof req.body.reply !== 'string' || !/^\d+$/.test(req.body.reply)) {
            res.status(200).json({error: '回复信息无效'})
            return
        }
        reply = parseInt(req.body.reply)
    }
    res.status(200).json(createComment(req.user.id, aid, req.body.content, reply))
})

router.post('/api_remove_comment', (req, res) => {
    if (!req.user.logged) {
        res.status(200).json({error: '未登录'})
        return
    }
    if (!req.body.cid || typeof req.body.cid !== 'string' || !/^\d+$/.test(req.body.cid)) {
        res.status(200).json({error: '需要提供一个评论编号'})
        return
    }
    let cid = parseInt(req.body.cid)
    if (!checkCommGrant(req.user.id, cid)) {
        res.status(200).json({error: '您没有权限删除该评论'})
        return
    }
    removeComment(cid)
    res.status(200).json({})
})

router.get('/:aid', (req, res) => {
    let helper = { isFollowed }
    if (!req.params.aid || typeof req.params.aid !== 'string' || !/^\d+$/.test(req.params.aid)) {
        res.redirect('/error/not_found')
        return
    }
    let aid = parseInt(req.params.aid)
    let art = getArticle(aid)
    if (art.invalid) {
        res.redirect('/error/not_found')
        return
    }
    let comments = countComments(aid), pages = Math.max(Math.ceil(comments / 20), 1)
    let page
    if (req.params.page) {
        if (typeof req.params.page !== 'string' || !/^\d+$/.test(req.params.page)) {
            res.redirect(`${aid}`)
            return
        }
        page = parseInt(req.params.page)
        if (page < 1) {
            res.redirect(`${aid}`)
            return
        }
        else {
            res.redirect(`${aid}?page=${pages}`)
            return
        }
    }
    else page = 1
    let currentPage = getComments(aid, page)
    let vote = getVote(req.user.id, aid), can_vote = !isBlocked(art.author, req.user.id)
    renderFile("./src/assets/pages/article/article.html", { isBlocked, checkCommGrant, floorToPage, vote, can_vote, hasGrant, currentPage, page, markdown, comments, helper, art, user: req.user }, (_err, _hypertext) => {
        renderFile("./src/assets/layouts/layout.html", {
            page: { title: art.title },
            config,
            user: req.user,
            content: _hypertext
        }, (err, hypertext) => {
            res.send(hypertext)
        })
    })
})

router.get('/:aid/edit', (req, res) => {
    if (!req.user.logged) {
        res.redirect('/error/login_first')
        return
    }
    if (!req.params.aid || typeof req.params.aid !== 'string' || !/^\d+$/.test(req.params.aid)) {
        res.redirect('/error/not_found')
        return
    }
    let aid = parseInt(req.params.aid)
    let art = getArticle(aid)
    if (art.invalid) {
        res.redirect('/error/not_found')
        return
    }
    if (!hasGrant(req.user.id, art.author)) {
        res.redirect('/error/permission_denied')
        return
    }
    let div = getDivide(art.divide)
    if (!div) {
        res.redirect('/error/not_found')
        return
    }
    if (div.announcement && !req.user.op) {
        res.redirect('/error/permission_denied')
        return
    }
    renderFile("./src/assets/pages/article/create_or_modify.html", { isModify: true, div, originalContent: art.content, articleId: aid, originalTitle: art.title, author: art.author }, (_err, _hypertext) => {
        renderFile("./src/assets/layouts/layout.html", {
            page: { title: '编辑文章' },
            config,
            user: req.user,
            content: _hypertext
        }, (err, hypertext) => {
            res.send(hypertext)
        })
    })
})

export default router