import React, { useRef, useEffect, useState } from 'react';
import Editor, { Monaco, OnChange, Theme } from '@monaco-editor/react';
import { useTheme } from './theme-provider';

import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

// @ts-ignore
self.MonacoEnvironment = {
    getWorker(_: any, label: string) {
        if (label === 'json') {
            return new jsonWorker();
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
            return new cssWorker();
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
            return new htmlWorker();
        }
        if (label === 'typescript' || label === 'javascript') {
            console.log('使用ts worker........................');
            return new tsWorker();
        }
        return new editorWorker();
    },
};

monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

interface MonacoEditorProps {
    filePath?: string;
    content: string;
    onChange?: (value: string) => void;
    height?: string;
    options?: any;
    language?: string;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
    filePath = 'file:///untitled',
    content,
    onChange,
    height = '100vh',
    options,
    language,
}) => {
    const editorRef = useRef<any>(null);
    const { theme } = useTheme();
    const [editorTheme, setEditorTheme] = useState<Theme>('vs-dark');

    // Update editor theme based on app theme
    useEffect(() => {
        if (theme === 'light') setEditorTheme('light');
        else setEditorTheme('vs-dark');
    }, [theme]);

    // Handle editor mount
    const handleEditorDidMount = (editor: any, monaco: Monaco) => {
        editorRef.current = editor;

        if (!monaco) {
            console.error('Monaco instance is undefined');
            return;
        }

        if (filePath) {
            try {
                const uri = monaco.Uri.parse(filePath);
                const existingModel = monaco.editor.getModel(uri);

                if (!existingModel) {
                    console.log('Creating new model for URI:', uri.toString());
                    const model = monaco.editor.createModel(
                        content,
                        language,
                        uri
                    );
                    editor.setModel(model);
                } else {
                    console.log(
                        'Using existing model for URI:',
                        uri.toString()
                    );
                    editor.setModel(existingModel);
                }
            } catch (error) {
                console.error('Error setting Monaco Editor model:', error);
                console.log('Fallback: Using default untitled file path');
                const uri = monaco.Uri.parse('file:///untitled');
                const model = monaco.editor.createModel(content, language, uri);
                editor.setModel(model);
            }
        }
    };

    // Handle content changes
    const handleChange: OnChange = (value) => {
        onChange?.(value || '');
    };

    // Update editor content when `content` prop changes
    useEffect(() => {
        if (editorRef.current) {
            const editor = editorRef.current;
            const model = editor.getModel();
            if (model && model.getValue() !== content) {
                model.setValue(content);
            }
        }
    }, [content]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (editorRef.current) {
                editorRef.current.dispose();
            }
        };
    }, []);

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
            }}
        />
    );
};

export default React.memo(MonacoEditor);
