import React, { useRef } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';

interface MonacoEditorProps {
    filePath: string;
    content: string;
    onChange?: (value: string) => void;
    height?: string;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
    filePath,
    content,
    onChange,
    height = '90vh',
}) => {
    const editorRef = useRef<any>(null);

    const handleEditorDidMount = (editor: any, monaco: Monaco) => {
        editorRef.current = editor;
    };

    const handleChange = (value) => {
        if (onChange) onChange(value);
    };

    return (
        <Editor
            height={height}
            theme="vs-dark"
            path={filePath}
            defaultValue={content}
            onChange={(value) => handleChange(value || '')}
            onMount={handleEditorDidMount}
            options={{
                minimap: { enabled: false },
                wordWrap: 'on',
            }}
        />
    );
};

export default MonacoEditor;
