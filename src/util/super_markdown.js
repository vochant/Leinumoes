import MarkdownIt from 'markdown-it';
import MarkdownItImsize from 'markdown-it-imsize';
import MarkdownItFootnote from 'markdown-it-footnote';
import MarkdownItHighlightJS from 'markdown-it-highlightjs';
import MarkdownItSpoiler from 'markdown-it-spoiler'
import MarkdownItMark from 'markdown-it-mark'
import markdownItTableOfContents from 'markdown-it-table-of-contents';
import markdownItMultimdTable from 'markdown-it-multimd-table';
import markdownItAbbr from 'markdown-it-abbr/dist/markdown-it-abbr.js';
import markdownItTaskLists from 'markdown-it-task-lists';
import { Media } from './markdown-it-media.js'
import { markdownItMention } from './markdown-it-mention.js'
import markdownItAnchor from 'markdown-it-anchor'
import markdownItKatex from '@vscode/markdown-it-katex'
import { full as markdownItEmoji } from 'markdown-it-emoji';
import twemoji from 'twemoji'
import katex from 'katex'
import { alert as markdownItAlert } from '@mdit/plugin-alert'

import "katex/contrib/mhchem"

var markdown = MarkdownIt({
    html: true,
    linkify: true,
	typographer: true
})

markdown.use(MarkdownItImsize)
markdown.use(MarkdownItFootnote)
markdown.use(MarkdownItHighlightJS, {inline: true})
markdown.use(MarkdownItSpoiler)
markdown.use(MarkdownItMark)
markdown.use(markdownItTableOfContents)
markdown.use(markdownItMultimdTable)
markdown.use(markdownItAbbr)
markdown.use(markdownItTaskLists)
markdown.use(Media)
markdown.use(markdownItMention)
markdown.use(markdownItAnchor)
markdown.use(markdownItKatex.default, {
    katex,
    delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false}
    ],
    macros: {
        "\\ge": "\\geqslant",
        "\\le": "\\leqslant",
        "\\geq": "\\geqslant",
        "\\leq": "\\leqslant"
    },
    allowInlineWithSpace: true,
    throwOnError: false,
    strict: "ignore"
})
markdown.use(markdownItEmoji, {shortcuts: {}})
markdown.use(markdownItAlert)

markdown.renderer.rules.emoji = function(token, idx) {
  return twemoji.parse(token[idx].content, {
    base: '/file/twemoji/',
    folder: 'svg',
    ext: '.svg'
  })
}

export default markdown;