import { useEffect, useState } from 'react';
import MonacoEditor from '@renderer/components/MonacoEditor';

interface EnumProps {
    basePath: string;
    currentItem: any;
    onCloseTab: () => void;
}

export const EditorLayout = ({ currentItem }: EnumProps) => {
    const [data, setData] = useState<any>(null);
    const [filePath, setFilePath] = useState<string>('');

    const getJsonData = async () => {
        if (!currentItem) return;
        console.log(currentItem.path);
        try {
            const data = await window.api.readProjectFile(currentItem.path);
            setData(data);
            setFilePath(currentItem.path);
        } catch (error) {
            console.error('Failed to load JSON content:', error);
        }
    };

    useEffect(() => {
        getJsonData();
    }, []);

    useEffect(() => {
        if (data) {
        }
    }, [data]);

    return (
        <div className="flex-1 bg-gray-50">
            {data ? (
                <MonacoEditor
                    filePath={filePath}
                    content={data}
                />
            ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                    Select a file to edit
                </div>
            )}
        </div>
    );
};
