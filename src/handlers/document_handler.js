import Router from 'express'
import { renderFile } from 'ejs'
import { config } from '../framework/config.js'
import { readFileSync, existsSync } from 'fs'
import markdown from '../util/super_markdown.js'

function renderItem(item) {
    let content = readFileSync(`./static/${item.file}`, 'utf-8')
    if (item.type === 'markdown') content = markdown.render(content)
    return content
}

const router = Router()

router.get('/:id', (req, res, next) => {
    if (!existsSync(`./static/${req.params.id}.json`)) {
        next()
        return
    }
    let jso = JSON.parse(readFileSync(`./static/${req.params.id}.json`, 'utf-8'))
    let body = jso.sections.map(x => renderItem(x)).join('')
    renderFile("./src/assets/pages/document.html", { body }, (_err, _hypertext) => {
        renderFile("./src/assets/layouts/layout.html", {
            page: { title: jso.title },
            config,
            user: req.user,
            content: _hypertext
        }, (err, hypertext) => {
            res.send(hypertext)
        })
    })
})

export default router