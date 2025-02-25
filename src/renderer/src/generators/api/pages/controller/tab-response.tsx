import React, { useState } from 'react';
import AddResponseModal from '../response/add-response-modal';
import { Label } from '@renderer/components/ui/label';
import { Combobox } from '@igrp/igrp-framework-react-design-system';
import { useTranslation } from 'react-i18next';
import { Input } from '@renderer/components/ui/input';
import { httpStatusCodes } from '@renderer/constants/appConstants';
import { cn } from '@renderer/lib/utils';
import { JSONSchemaBuilder } from '../../components/JSONSchema';
import { JSONSchema } from '../../types/schema';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@renderer/components/ui/card';
import { AddResponseMenu } from './add-response-menu';
import { Button } from '@renderer/components/ui/button';
import { Trash } from 'lucide-react';
import { LabelRequired } from '@renderer/components/required';

interface TabResponseProps {
    formik: any;
    schemaTypes?: { label: string; value: string }[];
    contentTypes: any;
    responseTypes: Array<any>;
    enumTypes: Array<any>;
}

export const TabResponse: React.FC<TabResponseProps> = ({
    formik,
    contentTypes,
    schemaTypes,
    responseTypes,
    enumTypes,
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { t } = useTranslation();

    const [activeResponseTab, setActiveResponseTab] = useState<string>('200');
    const [responses, setResponses] = useState(formik.values.responses);

    const handleAddResponse = (response: {
        name: string;
        statusCode: string;
        contentType: string;
        description?: string;
    }) => {
        const { name, description, statusCode, contentType } = response;

        const updatedResponses = {
            ...formik.values.responses,
            [statusCode]: {
                name,
                description,
                content: {
                    [contentType]: {
                        schema: null,
                    },
                },
            },
        };

        formik.setFieldValue('responses', updatedResponses);

        setActiveResponseTab(statusCode);
        setResponses((prevResponses) => ({
            ...prevResponses,
            [statusCode]: updatedResponses[statusCode],
        }));
    };

    const handleSchemaChange = (
        statusCode: string,
        contentType: string = 'application/json',
        newSchema: JSONSchema
    ) => {
        // Verificar se o schema realmente mudou antes de atualizar
        const currentSchema =
            formik.values.responses[statusCode]?.content[contentType];

        // Garantir que há propriedades antes de acessar
        const properties = newSchema.properties || {};
        const firstKey = Object.keys(properties)[0];

        // Se houver pelo menos uma propriedade, extraia o schema, senão mantenha o original
        const extractedSchema = firstKey ? properties[firstKey] : newSchema;

        if (
            currentSchema &&
            JSON.stringify(currentSchema.schema) ===
                JSON.stringify(extractedSchema)
        ) {
            return; // Não há mudanças, então não faça nada
        }

        // Atualizar os responses
        const updatedResponses = {
            ...formik.values.responses,
            [statusCode]: {
                ...formik.values.responses[statusCode], // Retain existing response details
                content: {
                    ...formik.values.responses[statusCode]?.content,
                    [contentType]: {
                        ...formik.values.responses[statusCode]?.content[
                            contentType
                        ],
                        schema: extractedSchema,
                    },
                },
            },
        };

        formik.setFieldValue('responses', updatedResponses);
    };

    const handleAddBlankResponse = () => {
        setIsModalOpen(true);
    };

    const handleClose = (statusCode: string) => {
        const updatedResponses = { ...responses };
        delete updatedResponses[statusCode];

        formik.setFieldValue('responses', updatedResponses);
        setResponses(updatedResponses);

        if (activeResponseTab === statusCode) {
            const remainingTabs = Object.keys(updatedResponses);
            setActiveResponseTab(remainingTabs[0]);
        }
    };

    return (
        <div className="w-full">
            {/* Response Tabs Navigation */}
            <div className="flex justify-between border-b mb-4 text-sm">
                <div className="flex space-x-4">
                    {Object.keys(responses).map((statusCode) => (
                        <button
                            key={statusCode}
                            onClick={() => setActiveResponseTab(statusCode)}
                            className={`px-4 py-2 ${
                                activeResponseTab === statusCode
                                    ? 'border-b-2 border-igrp text-igrp'
                                    : ''
                            }`}
                        >
                            {`${responses[statusCode].name} (${statusCode})`}
                        </button>
                    ))}
                </div>
                <AddResponseModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleAddResponse}
                    contentTypes={contentTypes}
                />
                <AddResponseMenu
                    onAddBlankResponse={handleAddBlankResponse}
                    responseTypes={responseTypes}
                    onSave={handleAddResponse}
                />
            </div>

            {/* Response Tab Content */}
            <div>
                {Object.keys(responses).map((statusCode) => {
                    const description = responses[statusCode].description || '';
                    const name = responses[statusCode].name;
                    const content = responses[statusCode].content;
                    const contentType = Object.keys(content)[0];

                    const schema = content?.[contentType]?.['schema'];

                    const contentData = schema
                        ? {
                              type: '',
                              properties: {
                                  [schema.name]: schema,
                              },
                          }
                        : null;

                    return (
                        <div
                            key={statusCode}
                            className={cn(
                                'space-y-4',
                                activeResponseTab === statusCode
                                    ? 'block'
                                    : 'hidden'
                            )}
                        >
                            <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-4">
                                <div className="flex flex-col gap-3">
                                    <LabelRequired>
                                        {t('httpStatusCode')}
                                    </LabelRequired>
                                    <Combobox
                                        options={httpStatusCodes}
                                        name="statusCode"
                                        value={statusCode}
                                        onChange={(value) =>
                                            handleAddResponse({
                                                statusCode: value,
                                                description,
                                                name,
                                                contentType,
                                            })
                                        }
                                        className="w-full focus:ring-igrp focus:border-igrp h-9"
                                        placeholder={t(
                                            'httpStatusCodePlaceholder'
                                        )}
                                    />
                                </div>
                                <div className="flex flex-col gap-3">
                                    <LabelRequired>{t('name')}</LabelRequired>
                                    <Input
                                        name={t('name')}
                                        value={name}
                                        onChange={(e) =>
                                            handleAddResponse({
                                                statusCode,
                                                description,
                                                name: e.target.value,
                                                contentType,
                                            })
                                        }
                                    />
                                </div>
                                <div className="flex flex-col gap-3">
                                    <LabelRequired>
                                        {t('contentType')}
                                    </LabelRequired>
                                    <Combobox
                                        name={t('contentType')}
                                        value={contentType}
                                        placeholder={t('selectContentType')}
                                        onChange={(value) =>
                                            handleAddResponse({
                                                statusCode,
                                                description,
                                                name,
                                                contentType: value,
                                            })
                                        }
                                        options={contentTypes}
                                        className="w-full focus:ring-igrp focus:border-igrp h-9"
                                    />
                                </div>

                                {Object.keys(responses).length > 1 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-3"
                                        onClick={() => handleClose(statusCode)}
                                    >
                                        <Trash />
                                    </Button>
                                )}
                            </div>

                            {/* Descritpion */}
                            <div className="flex flex-col gap-3">
                                <Label>{t('description')}</Label>
                                <Input
                                    type="text"
                                    name="description"
                                    value={description}
                                    onChange={(e) =>
                                        handleAddResponse({
                                            statusCode,
                                            description: e.target.value,
                                            name,
                                            contentType,
                                        })
                                    }
                                    className="w-full"
                                />
                            </div>

                            <Card className="rounded">
                                <CardHeader>
                                    <CardTitle>{t('dataSchema')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <JSONSchemaBuilder
                                        schemaTypes={schemaTypes}
                                        enumTypes={enumTypes}
                                        initialSchema={contentData}
                                        onSchemaChange={(value) => {
                                            handleSchemaChange(
                                                statusCode,
                                                contentType,
                                                value
                                            );
                                        }}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
