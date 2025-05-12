'use client';

import { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@renderer/components/ui/dialog';
import { Button } from '@renderer/components/ui/button';
import { Input } from '@renderer/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@renderer/components/ui/select';
import MonacoEditor from '@renderer/components/monaco-editor';
import { DialogDescription } from '@radix-ui/react-dialog';
import { SerializationConfig } from '@igrp/igrp-studio-springboot-engine/dist/interfaces/types';
import { ENV_TYPES } from '@renderer/constants/appConstants';
import useToast from '@renderer/hooks/useToast';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { useGit } from '@renderer/hooks/use-git';
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks';
import { LabelRequired } from '@renderer/components/label-required';

interface SerializationConfigModalProps {
    isOpen?: boolean;
    setIsOpen?: (open: boolean) => void;
    item?: any;
    basePath?: string;
}

export default function SerializationConfigModal({
    isOpen = false,
    setIsOpen,
    item,
    basePath,
}: SerializationConfigModalProps) {
    const [config, setConfig] = useState<SerializationConfig>({
        name: '',
        type: 'dto',
        template: 'classic',
        module: '',
    });

    const [content, setContent] = useState('');
    const [contentType, setContenType] = useState('json');

    const { showErrorToast, showSuccessToast } = useToast();
    const { t } = useTranslation();
    const dispatch: any = useDispatch();

    const { createGitCommit } = useGit();

    useEffect(() => {
        const { module, type } = item;
        setConfig((prev) => ({
            ...prev,
            module,
            type: type === 'models' ? 'model' : type
        }));
    }, [item]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setConfig((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (value: string) => {
        setContenType(value);
    };

    const handleEditorChange = (value: string | undefined) => {
        if (value !== undefined) {
            setContent(value);
        }
    };

    // Função para limpar espaços extras
    const cleanSQL = (sql: string): string => {
        return sql
            .split('\n') // Quebra em linhas
            .map((line) => line.trim()) // Aplica trim em cada linha
            .filter((line) => line !== '') // Remove linhas vazias
            .join('\n')
            .replace(/\s+/g, ' ') // Substitui múltiplos espaços e quebras de linha por um único espaço
            .trim();
    }   

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!item || !basePath) return;

        const values = {
            ...config,
            [contentType]:  cleanSQL(content) ,
        };

        const { error } = await window.engine.serializeElement(
            values,
            ENV_TYPES.SPRING,
            basePath
        );

        console.log(values);

        if (error) {
            showErrorToast(error);
        } else {
            showSuccessToast(
                t('createdSuccess', {
                    name: t(values.type),
                    value: values.name,
                })
            );

            setIsOpen?.(false);

            createGitCommit(basePath, `Create ${values.name}`);

            dispatch(onSetChangeStatus(true));
        }
    };

    const getEditorLanguage = () => {
        switch (config.type) {
            case 'dto':
                return 'json';
            case 'model':
                return 'sql';
            case 'response':
                return 'xml';
            default:
                return 'plaintext';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent
                className="max-w-[700px]"
                onClick={(e) => e.stopPropagation()}
            >
                <DialogHeader>
                    <DialogTitle>{t('import')}</DialogTitle>
                    <DialogDescription />
                </DialogHeader>
                <form
                    onSubmit={(e) => {
                        e.stopPropagation();
                        handleSubmit(e);
                    }}
                    className="space-y-4"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <div className="items-center space-y-2">
                            <LabelRequired>{t('name')}</LabelRequired>
                            <Input
                                id="name"
                                name="name"
                                value={config.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="items-center space-y-2">
                            <LabelRequired>{t('contentType')}</LabelRequired>
                            <Select
                                onValueChange={(value) =>
                                    handleSelectChange(value)
                                }
                                value={contentType}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={t('selectContentType')}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="json">{t('json')}</SelectItem>
                                    <SelectItem value="sql">{t('sql')}</SelectItem>
                                    <SelectItem value="xml">{t('xml')}</SelectItem>
                                    <SelectItem value="ddl">{t('ddl')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <MonacoEditor
                        height="300px"
                        language={getEditorLanguage()}
                        content={content}
                        onChange={handleEditorChange}
                        options={{
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            fontSize: 14,
                        }}
                    />
                    <DialogFooter>
                        <Button type="submit">{t('save')}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
