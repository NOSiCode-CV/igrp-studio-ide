import Editor, { type OnMount } from '@monaco-editor/react'
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system'
import { Check, FileCode2, ListChecks, Save } from 'lucide-react'
import * as monaco from 'monaco-editor'
import { type JSX, useCallback, useEffect, useRef, useState } from 'react'
import useToast from '../../../../hooks/useToast'
import { useTheme } from '../../../../components/theme-provider'

interface XmlTabProps {
    /** Camunda XML produced after Activiti→Camunda conversion at the boundary. */
    xml: string
    onChange: (xml: string) => void
}

/**
 * Re-indents an XML string by walking opening/closing tags. Best-effort, good
 * enough for BPMN documents (which are well-formed). Whitespace inside text
 * nodes is preserved when the node is non-empty / not pure whitespace.
 */
function formatXml(xml: string, indentSize = 2): string {
    const indent = ' '.repeat(indentSize)
    const stripped = xml.replace(/>\s+</g, '><').trim()
    let depth = 0
    let out = ''
    let i = 0
    while (i < stripped.length) {
        if (stripped[i] !== '<') {
            const next = stripped.indexOf('<', i)
            const text = stripped.slice(i, next === -1 ? stripped.length : next)
            if (text.trim().length > 0) out += text
            i = next === -1 ? stripped.length : next
            continue
        }
        const close = stripped.indexOf('>', i)
        if (close === -1) {
            out += stripped.slice(i)
            break
        }
        const tag = stripped.slice(i, close + 1)
        const isClose = tag.startsWith('</')
        const isSelfClose = tag.endsWith('/>') || tag.startsWith('<?') || tag.startsWith('<!')
        if (isClose) depth = Math.max(0, depth - 1)
        if (out.length > 0) out += '\n'
        out += indent.repeat(depth) + tag
        if (!isClose && !isSelfClose) depth += 1
        i = close + 1
    }
    return out
}

/** Returns null on success, error message on failure. */
function validateXml(xml: string): string | null {
    if (!xml.trim()) return 'XML is empty'
    try {
        const parser = new DOMParser()
        const doc = parser.parseFromString(xml, 'application/xml')
        const errorNode = doc.querySelector('parsererror')
        if (errorNode) {
            return errorNode.textContent?.trim() || 'XML is not well-formed'
        }
        return null
    } catch (err) {
        return err instanceof Error ? err.message : String(err)
    }
}

export function XmlTab({ xml, onChange }: XmlTabProps): JSX.Element {
    const { theme } = useTheme()
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
    const [draft, setDraft] = useState<string>(xml)
    const [dirty, setDirty] = useState<boolean>(false)
    const { showSuccessToast, showErrorToast, showWarningToast } = useToast()

    // Sync prop → local draft when an external load lands (initial fetch,
    // optimistic update from DiagramTab, etc.) and the user hasn't edited.
    useEffect(() => {
        if (!dirty) setDraft(xml)
    }, [xml, dirty])

    const commit = useCallback(
        (next: string): void => {
            setDirty(false)
            onChange(next)
        },
        [onChange]
    )

    const handleEditorChange = (value: string | undefined): void => {
        const next = value ?? ''
        setDraft(next)
        setDirty(next !== xml)
    }

    const handleMount: OnMount = (editor) => {
        editorRef.current = editor
        editor.onDidBlurEditorText(() => {
            const current = editor.getValue()
            if (current !== xml) commit(current)
        })
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            const current = editor.getValue()
            if (current !== xml) commit(current)
        })
    }

    const handleFormat = (): void => {
        const formatted = formatXml(draft)
        setDraft(formatted)
        setDirty(formatted !== xml)
        editorRef.current?.setValue(formatted)
    }

    const handleValidate = (): void => {
        const error = validateXml(draft)
        if (error) {
            showErrorToast(new Error(error))
        } else {
            showSuccessToast('XML is well-formed')
        }
    }

    const handleManualSave = (): void => {
        const error = validateXml(draft)
        if (error) {
            showWarningToast(`Saving anyway, but XML is not well-formed: ${error}`)
        }
        commit(draft)
    }

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-end gap-2 border-b px-3 py-2">
                <IGRPButtonPrimitive variant="outline" size="sm" onClick={handleFormat}>
                    <FileCode2 className="mr-1 h-4 w-4" />
                    Format
                </IGRPButtonPrimitive>
                <IGRPButtonPrimitive variant="outline" size="sm" onClick={handleValidate}>
                    <ListChecks className="mr-1 h-4 w-4" />
                    Validate
                </IGRPButtonPrimitive>
                <IGRPButtonPrimitive
                    variant={dirty ? 'default' : 'secondary'}
                    size="sm"
                    onClick={handleManualSave}
                    disabled={!dirty}
                >
                    {dirty ? (
                        <Save className="mr-1 h-4 w-4" />
                    ) : (
                        <Check className="mr-1 h-4 w-4" />
                    )}
                    {dirty ? 'Save' : 'Saved'}
                </IGRPButtonPrimitive>
            </div>
            <div className="flex-1 overflow-hidden">
                <Editor
                    height="100%"
                    language="xml"
                    value={draft}
                    theme={theme === 'light' ? 'light' : 'vs-dark'}
                    onChange={handleEditorChange}
                    onMount={handleMount}
                    options={{
                        minimap: { enabled: false },
                        wordWrap: 'on',
                        tabSize: 2,
                        autoIndent: 'full'
                    }}
                />
            </div>
        </div>
    )
}
