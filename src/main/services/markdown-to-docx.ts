/**
 * Converts a markdown source into a list of `docx` block elements
 * (Paragraphs + Tables) that can be dropped straight into a Section.
 *
 * We reuse the `markdown-it` token stream so the rendering rules match the
 * PDF/preview pipeline. The token walker mirrors `markdown-it`'s linear
 * stream: container `*_open`/`*_close` tokens push/pop state, `inline`
 * tokens hold the actual text+formatting children.
 *
 * Supported constructs:
 *   - Headings h1–h6
 *   - Paragraphs
 *   - Bold / italic / inline code
 *   - Inline links (rendered as ExternalHyperlink)
 *   - Bullet / ordered lists (single level — nested lists are flattened with
 *     a visual indent so we don't have to chase docx's numbering ids)
 *   - Code blocks (fenced or indented)
 *   - Blockquotes
 *   - Horizontal rules
 *   - GFM tables
 *
 * Anything unrecognised falls back to plain text so we never lose content.
 */
import MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'
import {
    AlignmentType,
    BorderStyle,
    ExternalHyperlink,
    HeadingLevel,
    type IParagraphOptions,
    type IRunOptions,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType
} from 'docx'

type Block = Paragraph | Table

interface InlineState {
    bold: boolean
    italic: boolean
    code: boolean
    link?: string
}

const HEADING_LEVELS: Record<string, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
    h1: HeadingLevel.HEADING_1,
    h2: HeadingLevel.HEADING_2,
    h3: HeadingLevel.HEADING_3,
    h4: HeadingLevel.HEADING_4,
    h5: HeadingLevel.HEADING_5,
    h6: HeadingLevel.HEADING_6
}

const CODE_FONT = 'Consolas'
const CODE_BG = 'F6F8FA'
const TABLE_BORDER = { style: BorderStyle.SINGLE, size: 4, color: 'D0D7DE' }

export function markdownToDocxBlocks(markdown: string): Block[] {
    const md = new MarkdownIt({ html: false, linkify: true, breaks: false })
    const tokens = md.parse(markdown || '', {})
    const out: Block[] = []
    const walker = new TokenWalker(tokens)
    while (!walker.done) {
        const block = walker.nextBlock()
        if (block) out.push(...(Array.isArray(block) ? block : [block]))
    }
    return out
}

class TokenWalker {
    private i = 0

    constructor(private readonly tokens: Token[]) {}

    get done(): boolean {
        return this.i >= this.tokens.length
    }

    nextBlock(): Block | Block[] | null {
        const t = this.tokens[this.i]
        if (!t) {
            this.i++
            return null
        }

        switch (t.type) {
            case 'heading_open':
                return this.consumeHeading(t.tag)
            case 'paragraph_open':
                return this.consumeParagraph()
            case 'bullet_list_open':
                return this.consumeList(false)
            case 'ordered_list_open':
                return this.consumeList(true)
            case 'blockquote_open':
                return this.consumeBlockquote()
            case 'fence':
            case 'code_block':
                this.i++
                return codeBlock(t.content)
            case 'hr':
                this.i++
                return horizontalRule()
            case 'table_open':
                return this.consumeTable()
            default:
                // Stray inline/text token outside a paragraph — render as a
                // bare paragraph so we don't drop content silently.
                if (t.type === 'inline') {
                    this.i++
                    return new Paragraph({ children: inlineChildren(t.children ?? []) })
                }
                this.i++
                return null
        }
    }

    private consumeHeading(tag: string): Paragraph {
        this.i++ // heading_open
        const inline = this.tokens[this.i]
        this.i++ // inline
        this.i++ // heading_close
        const level = HEADING_LEVELS[tag] ?? HeadingLevel.HEADING_3
        return new Paragraph({
            heading: level,
            children: inlineChildren(inline?.children ?? [])
        })
    }

    private consumeParagraph(): Paragraph {
        this.i++ // paragraph_open
        const inline = this.tokens[this.i]
        this.i++ // inline
        this.i++ // paragraph_close
        return new Paragraph({ children: inlineChildren(inline?.children ?? []) })
    }

    private consumeList(ordered: boolean): Paragraph[] {
        const out: Paragraph[] = []
        this.i++ // list_open
        let counter = 0
        while (!this.done && this.tokens[this.i].type !== (ordered ? 'ordered_list_close' : 'bullet_list_close')) {
            const tk = this.tokens[this.i]
            if (tk.type === 'list_item_open') {
                counter++
                this.i++ // list_item_open
                const itemChildren: Array<TextRun | ExternalHyperlink> = []
                while (!this.done && this.tokens[this.i].type !== 'list_item_close') {
                    const inner = this.tokens[this.i]
                    if (inner.type === 'paragraph_open') {
                        this.i++ // paragraph_open
                        const inline = this.tokens[this.i]
                        this.i++ // inline
                        this.i++ // paragraph_close
                        if (itemChildren.length) itemChildren.push(new TextRun({ text: ' ' }))
                        itemChildren.push(...inlineChildren(inline?.children ?? []))
                    } else {
                        // Nested lists / blockquotes inside list items: skip
                        // their open token, the loop will pick up the inner
                        // tokens as separate paragraphs.
                        this.i++
                    }
                }
                this.i++ // list_item_close
                const prefix = ordered ? `${counter}. ` : '•  '
                out.push(
                    new Paragraph({
                        spacing: { before: 60, after: 60 },
                        indent: { left: 360 },
                        children: [new TextRun({ text: prefix }), ...itemChildren]
                    })
                )
            } else {
                this.i++
            }
        }
        this.i++ // list_close
        return out
    }

    private consumeBlockquote(): Paragraph[] {
        this.i++ // blockquote_open
        const out: Paragraph[] = []
        while (!this.done && this.tokens[this.i].type !== 'blockquote_close') {
            const tk = this.tokens[this.i]
            if (tk.type === 'paragraph_open') {
                this.i++ // paragraph_open
                const inline = this.tokens[this.i]
                this.i++ // inline
                this.i++ // paragraph_close
                out.push(
                    new Paragraph({
                        indent: { left: 360 },
                        border: {
                            left: { style: BorderStyle.SINGLE, size: 12, color: 'D0D7DE', space: 8 }
                        },
                        children: inlineChildren(inline?.children ?? [], {
                            bold: false,
                            italic: true,
                            code: false
                        })
                    })
                )
            } else {
                this.i++
            }
        }
        this.i++ // blockquote_close
        return out
    }

    private consumeTable(): Block[] {
        const rows: TableRow[] = []
        this.i++ // table_open
        let isHeader = false
        let currentRowCells: TableCell[] = []
        while (!this.done && this.tokens[this.i].type !== 'table_close') {
            const tk = this.tokens[this.i]
            switch (tk.type) {
                case 'thead_open':
                    isHeader = true
                    this.i++
                    break
                case 'thead_close':
                case 'tbody_open':
                case 'tbody_close':
                    isHeader = false
                    if (tk.type === 'thead_close') isHeader = false
                    this.i++
                    break
                case 'tr_open':
                    currentRowCells = []
                    this.i++
                    break
                case 'tr_close':
                    rows.push(new TableRow({ children: currentRowCells, tableHeader: isHeader }))
                    this.i++
                    break
                case 'th_open':
                case 'td_open': {
                    const isTh = tk.type === 'th_open'
                    this.i++ // th_open / td_open
                    const inline = this.tokens[this.i]
                    this.i++ // inline
                    this.i++ // th_close / td_close
                    currentRowCells.push(
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: inlineChildren(inline?.children ?? [], {
                                        bold: isTh,
                                        italic: false,
                                        code: false
                                    })
                                })
                            ]
                        })
                    )
                    break
                }
                default:
                    this.i++
            }
        }
        this.i++ // table_close
        return [
            new Table({
                rows,
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                    top: TABLE_BORDER,
                    bottom: TABLE_BORDER,
                    left: TABLE_BORDER,
                    right: TABLE_BORDER,
                    insideHorizontal: TABLE_BORDER,
                    insideVertical: TABLE_BORDER
                }
            }),
            new Paragraph({ spacing: { after: 120 }, children: [] })
        ]
    }
}

function inlineChildren(
    tokens: Token[],
    base: InlineState = { bold: false, italic: false, code: false }
): Array<TextRun | ExternalHyperlink> {
    const out: Array<TextRun | ExternalHyperlink> = []
    const state: InlineState = { ...base }
    let linkBuffer: TextRun[] | null = null
    let linkHref = ''

    const pushRun = (text: string, override?: Partial<InlineState>) => {
        const s = { ...state, ...override }
        const runOpts: IRunOptions = s.code
            ? {
                  text,
                  bold: s.bold || undefined,
                  italics: s.italic || undefined,
                  font: CODE_FONT,
                  shading: { type: 'clear', color: 'auto', fill: CODE_BG }
              }
            : {
                  text,
                  bold: s.bold || undefined,
                  italics: s.italic || undefined
              }
        const run = new TextRun(runOpts)
        if (linkBuffer) linkBuffer.push(run)
        else out.push(run)
    }

    for (const tk of tokens) {
        switch (tk.type) {
            case 'text':
                pushRun(tk.content)
                break
            case 'softbreak':
            case 'hardbreak':
                if (linkBuffer) linkBuffer.push(new TextRun({ text: ' ' }))
                else out.push(new TextRun({ break: 1 }))
                break
            case 'strong_open':
                state.bold = true
                break
            case 'strong_close':
                state.bold = base.bold
                break
            case 'em_open':
                state.italic = true
                break
            case 'em_close':
                state.italic = base.italic
                break
            case 'code_inline':
                pushRun(tk.content, { code: true })
                break
            case 'link_open':
                linkBuffer = []
                linkHref = tk.attrGet('href') ?? ''
                break
            case 'link_close':
                if (linkBuffer) {
                    out.push(new ExternalHyperlink({ link: linkHref, children: linkBuffer }))
                    linkBuffer = null
                }
                break
            default:
                if (tk.content) pushRun(tk.content)
        }
    }

    return out
}

function codeBlock(content: string): Paragraph[] {
    const lines = content.replace(/\n$/, '').split('\n')
    return lines.map(
        (line, idx) =>
            new Paragraph({
                spacing: idx === 0 ? { before: 120 } : undefined,
                shading: { type: 'clear', color: 'auto', fill: CODE_BG },
                children: [new TextRun({ text: line || ' ', font: CODE_FONT, size: 20 })]
            })
    )
}

function horizontalRule(): Paragraph {
    return new Paragraph({
        spacing: { before: 200, after: 200 },
        border: {
            bottom: { style: BorderStyle.SINGLE, size: 6, color: 'D0D7DE' }
        },
        children: []
    })
}

export function titleHeading(title: string): Paragraph {
    return new Paragraph({
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.LEFT,
        children: [new TextRun({ text: title, bold: true })]
    } satisfies IParagraphOptions)
}

export function metaLine(text: string): Paragraph {
    return new Paragraph({
        spacing: { after: 240 },
        children: [new TextRun({ text, italics: true, color: '57606A', size: 18 })]
    })
}
