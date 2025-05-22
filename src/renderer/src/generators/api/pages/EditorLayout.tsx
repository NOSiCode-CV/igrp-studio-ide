import { useEffect, useState } from 'react';
import MonacoEditor from '@renderer/components/monaco-editor';
import { useTranslation } from 'react-i18next';

export const EditorLayout = ({ currentItem }) => {
    const { t } = useTranslation();
    const [data, setData] = useState<any>(null);
    const [filePath, setFilePath] = useState<string>('');

    const getData = async () => {
        if (!currentItem) return;
        try {
            const data = await window.api.readProjectFile(currentItem.path);
            setData(data);
            setFilePath(currentItem.path);
        } catch (error) {
            console.error(t("failedLoadJsonContent"), error);
        }
    };

    useEffect(() => {
        getData();
    }, [currentItem]);

    return (
        <div className="flex-1 bg-gray-50">
            {data ? (
                <MonacoEditor
                    filePath={filePath}
                    content={data}
                />
            ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                   {t('selectFileToEdit')}
                </div>
            )}
        </div>
    );
};
