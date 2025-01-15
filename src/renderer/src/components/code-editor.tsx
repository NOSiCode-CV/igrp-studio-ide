import React from 'react';
import { ReactCodeMirrorProps } from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import ReactCodeMirror from '@uiw/react-codemirror';

interface CodeEditorProps extends ReactCodeMirrorProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
    value,
    onChange,
    className = '',
    ...props
}) => {
    const handleChange = (value: string) => {
        onChange(value);
    };

    return (
        <ReactCodeMirror
            value={value}
            height="auto"
            extensions={[json()]}
            onChange={handleChange}
            className={`border border-gray-300 rounded-md shadow-sm focus:ring-igrp focus:border-igrp ${className}`}
            {...props}
        />
    );
};

export default CodeEditor;