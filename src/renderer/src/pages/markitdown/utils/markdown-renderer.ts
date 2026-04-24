import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: false,
    breaks: false,
    highlight(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value
            } catch {
                /* fall through */
            }
        }
        try {
            return hljs.highlightAuto(code).value
        } catch {
            return ''
        }
    }
})

export function renderMarkdownToSafeHtml(markdown: string): string {
    const rawHtml = md.render(markdown)
    return DOMPurify.sanitize(rawHtml, {
        ADD_ATTR: ['target', 'rel'],
        FORBID_TAGS: ['style', 'script', 'iframe']
    })
}
