import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import Editor, { Monaco, OnChange, Theme } from '@monaco-editor/react'
import { useTheme } from './theme-provider'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

// @ts-ignore
self.MonacoEnvironment = {
  getWorker(_: any, label: string) {
    if (label === 'json') {
      return new jsonWorker()
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker()
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker()
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker()
    }
    return new editorWorker()
  }
}

monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true)

interface MonacoEditorProps {
  filePath?: string
  content: string
  onChange?: (value: string) => void
  height?: string
  options?: any
  language?: string
}

export interface MonacoEditorHandle {
  insertTextAtCursor: (text: string) => void
  getEditor: () => monaco.editor.IStandaloneCodeEditor | null
}

const MonacoEditor = forwardRef<MonacoEditorHandle, MonacoEditorProps>(
  (
    { filePath = 'file:///untitled', content, onChange, height = '100vh', options, language },
    ref
  ) => {
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
    const monacoRef = useRef<Monaco | null>(null)
    const { theme } = useTheme()
    const [editorTheme, setEditorTheme] = useState<Theme>('vs-dark')

    // Expose editor methods via ref
    useImperativeHandle(ref, () => ({
      insertTextAtCursor: (text: string) => {
        if (editorRef.current) {
          const editor = editorRef.current
          const selection = editor.getSelection()
          const range = selection
            ? new monaco.Range(
                selection.startLineNumber,
                selection.startColumn,
                selection.endLineNumber,
                selection.endColumn
              )
            : new monaco.Range(1, 1, 1, 1)

          editor.executeEdits('insert-text', [
            {
              range,
              text,
              forceMoveMarkers: true
            }
          ])
        }
      },
      getEditor: () => editorRef.current
    }))

    // Update editor theme based on app theme
    useEffect(() => {
      if (theme === 'light') setEditorTheme('light')
      else setEditorTheme('vs-dark')
    }, [theme])

    // Handle editor mount
    const handleEditorDidMount = (
      editor: monaco.editor.IStandaloneCodeEditor,
      monacoInstance: Monaco
    ) => {
      editorRef.current = editor
      monacoRef.current = monacoInstance

      if (!monacoInstance) {
        console.error('Monaco instance is undefined')
        return
      }

      if (filePath) {
        try {
          const uri = monacoInstance.Uri.parse(filePath)
          const existingModel = monacoInstance.editor.getModel(uri)

          if (!existingModel) {
            const model = monacoInstance.editor.createModel(content, language, uri)
            editor.setModel(model)
          } else {
            editor.setModel(existingModel)
          }
        } catch (error) {
          console.error('Error setting Monaco Editor model:', error)
          const uri = monacoInstance.Uri.parse('file:///untitled')
          const model = monacoInstance.editor.createModel(content, language, uri)
          editor.setModel(model)
        }
      }
    }

    // Handle content changes
    const handleChange: OnChange = (value) => {
      onChange?.(value || '')
    }

    // Update editor content when `content` prop changes
    useEffect(() => {
      if (editorRef.current) {
        const editor = editorRef.current
        const model = editor.getModel()
        if (model && model.getValue() !== content) {
          model.setValue(content)
        }
      }
    }, [content])

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (editorRef.current) {
          editorRef.current.dispose()
        }
      }
    }, [])

    return (
      <Editor
        path={filePath}
        height={height}
        theme={editorTheme}
        value={content}
        language={language}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        options={{
          ...options,
          minimap: { enabled: false },
          wordWrap: 'on',
          autoIndent: 'full',
          tabSize: 2
        }}
      />
    )
  }
)

MonacoEditor.displayName = 'MonacoEditor'

export default MonacoEditor
