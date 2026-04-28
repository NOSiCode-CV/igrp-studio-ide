/**
 * Exports a Specification document (markdown) to PDF or DOCX.
 *
 *  - PDF: render markdown → HTML → load into a hidden BrowserWindow →
 *    `webContents.printToPDF()`. No extra dependency on the renderer side and
 *    fidelity is good (CSS works, GFM renders).
 *  - DOCX: same HTML pipeline → `html-to-docx` produces a buffer we drop on
 *    disk. Works with the same styled HTML, so PDF and Word stay close.
 *
 * The renderer never sees the export details — it just calls IPC with a
 * target path picked via `dialog.showSaveDialog`.
 */
import { promises as fsp } from 'node:fs'
import { BrowserWindow } from 'electron'
import { marked } from 'marked'
import HtmlToDocx from 'html-to-docx'
import { specDocService } from './spec-doc-service'

export type DocExportFormat = 'pdf' | 'docx'

interface ExportInput {
    basePath: string
    docId: string
    targetPath: string
}

class SpecDocExportService {
    async exportPdf({ basePath, docId, targetPath }: ExportInput): Promise<void> {
        const html = await this.renderHtml(basePath, docId)
        const window = new BrowserWindow({
            show: false,
            webPreferences: { sandbox: true, javascript: false }
        })
        try {
            await window.loadURL(
                `data:text/html;charset=UTF-8,${encodeURIComponent(html)}`
            )
            const pdf = await window.webContents.printToPDF({
                printBackground: true,
                margins: { top: 0.6, right: 0.6, bottom: 0.6, left: 0.6 },
                pageSize: 'A4'
            })
            await fsp.writeFile(targetPath, pdf)
        } finally {
            window.close()
        }
    }

    async exportDocx({ basePath, docId, targetPath }: ExportInput): Promise<void> {
        const html = await this.renderHtml(basePath, docId)
        const buffer = (await HtmlToDocx(html, undefined, {
            table: { row: { cantSplit: true } },
            footer: false,
            pageNumber: false
        })) as Buffer | Blob | ArrayBuffer

        // html-to-docx returns Buffer in Node, Blob in browser, ArrayBuffer in
        // some bundlers. Normalise to a Node Buffer before writing.
        let outBuffer: Buffer
        if (Buffer.isBuffer(buffer)) outBuffer = buffer
        else if (buffer instanceof ArrayBuffer) outBuffer = Buffer.from(buffer)
        else if (typeof (buffer as Blob).arrayBuffer === 'function') {
            outBuffer = Buffer.from(await (buffer as Blob).arrayBuffer())
        } else {
            throw new Error('Unexpected return type from html-to-docx')
        }
        await fsp.writeFile(targetPath, outBuffer)
    }

    /**
     * Renders the document's markdown into a styled HTML page suitable for both
     * PDF and DOCX conversion. Tables, code blocks and headings get sane
     * print styles; we keep colours muted so the output reads well on paper.
     */
    private async renderHtml(basePath: string, docId: string): Promise<string> {
        const result = await specDocService.read(basePath, docId)
        if (!result) throw new Error(`Document ${docId} not found`)
        const { node, content } = result
        const body = await marked.parse(content || '', { gfm: true, breaks: false })
        const safeTitle = escapeHtml(node.name.replace(/\.md$/i, ''))

        return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${safeTitle}</title>
<style>
  @page { size: A4; }
  html, body {
    font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.55;
    color: #1f2328;
    background: #ffffff;
    margin: 0;
  }
  body { padding: 1.6cm 1.6cm 1.4cm 1.6cm; }
  h1 { font-size: 22pt; margin: 0 0 0.4em; }
  h2 { font-size: 16pt; margin: 1.2em 0 0.4em; border-bottom: 1px solid #d0d7de; padding-bottom: 0.2em; }
  h3 { font-size: 13pt; margin: 1em 0 0.3em; }
  h4, h5, h6 { font-size: 11pt; margin: 0.9em 0 0.3em; }
  p { margin: 0.5em 0; }
  ul, ol { margin: 0.4em 0 0.6em 1.4em; padding: 0; }
  li { margin: 0.15em 0; }
  pre, code {
    font-family: 'JetBrains Mono', 'SFMono-Regular', Menlo, Consolas, monospace;
    font-size: 9.5pt;
  }
  pre {
    background: #f6f8fa;
    border: 1px solid #d0d7de;
    border-radius: 4px;
    padding: 10px 12px;
    overflow: auto;
    page-break-inside: avoid;
  }
  code { background: #f6f8fa; padding: 1px 4px; border-radius: 3px; }
  pre code { background: transparent; padding: 0; }
  blockquote {
    border-left: 3px solid #d0d7de;
    color: #57606a;
    margin: 0.6em 0;
    padding: 0.1em 0.9em;
  }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 0.6em 0;
    font-size: 10pt;
  }
  th, td {
    border: 1px solid #d0d7de;
    padding: 6px 9px;
    text-align: left;
    vertical-align: top;
  }
  th { background: #f6f8fa; font-weight: 600; }
  hr { border: none; border-top: 1px solid #d0d7de; margin: 1em 0; }
  a { color: #0969da; text-decoration: none; }
  img { max-width: 100%; }
  header.spec-doc-header {
    border-bottom: 2px solid #d0d7de;
    margin-bottom: 1.2em;
    padding-bottom: 0.6em;
  }
  header.spec-doc-header .meta {
    color: #57606a;
    font-size: 9pt;
    margin-top: 0.2em;
  }
</style>
</head>
<body>
<header class="spec-doc-header">
  <h1>${safeTitle}</h1>
  <div class="meta">Exported from IGRP Studio · ${new Date().toLocaleString()}</div>
</header>
${body}
</body>
</html>`
    }
}

function escapeHtml(input: string): string {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

export const specDocExportService = new SpecDocExportService()
