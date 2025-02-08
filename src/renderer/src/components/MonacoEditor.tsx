import React, { useRef, useEffect, useState } from 'react';
import Editor, { Monaco, OnChange, Theme } from '@monaco-editor/react';
import { useTheme } from './theme-provider';

interface MonacoEditorProps {
    filePath?: string;
    content: string;
    onChange?: (value: string) => void;
    height?: string;
    options?: any;
    language?: string
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
    filePath,
    content,
    onChange,
    height = '100vh',
    options,
    language
}) => {
    const editorRef = useRef<any>(null);

    const { theme } = useTheme();

    const [editorTheme, setEditorTheme] = useState<Theme>('vs-dark');

    useEffect(() => {
        if (theme === 'light') setEditorTheme('light');
        else setEditorTheme('vs-dark');
    }, [theme]);

    const handleEditorDidMount = (editor: any, _monaco: Monaco) => {
        editorRef.current = editor;
    };

    const handleChange: OnChange = (value) => {
        if (onChange) onChange(value || '');
    };

    useEffect(() => {
        return () => {
            if (editorRef.current) {
                editorRef.current.dispose();
            }
        };
    }, []);

    if (process.env.NODE_ENV === 'development') {
        console.log(filePath);
    }

    return (
        <Editor
            height={height}
            theme={editorTheme}
            path={filePath}
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
