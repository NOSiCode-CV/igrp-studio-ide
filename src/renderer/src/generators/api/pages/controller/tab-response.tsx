import React, { useState } from 'react';
import AddResponseModal from '../response/add-response-modal';
import { Label } from '@renderer/components/ui/label';
import { Combobox } from '@igrp/igrp-design-system';
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

interface TabResponseProps {
    formik: any;
    schemaTypes?: { label: string; value: string }[];
    contentTypes: any;
    responseTypes: Array<any>;
}

export const TabResponse: React.FC<TabResponseProps> = ({
    formik,
    contentTypes,
    schemaTypes,
    responseTypes,
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { t } = useTranslation();

    const [activeResponseTab, setActiveResponseTab] = useState<string>('200');
    const [responses, setResponses] = useState(formik.values.responses);

    const handleAddResponse = (response: {
        name: string;
        statusCode: string;
        contentType: string;
    }) => {
        const { name, statusCode, contentType } = response;

        const updatedResponses = {
            ...formik.values.responses,
            [statusCode]: {
                name,
                decription: null,
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

        // Se o schema for o mesmo, não faça nada
        if (
            currentSchema &&
            JSON.stringify(currentSchema.schema) === JSON.stringify(newSchema)
        ) {
            return; // Não há mudanças, então não faça nada
        }

        // Update the content for the given statusCode
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
                        schema: newSchema,
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
                    const description = responses[statusCode].description;
                    const name = responses[statusCode].name;
                    const content = responses[statusCode].content;
                    const contentType = Object.keys(content)[0];
                    const contentData = content[contentType]['schema'];
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
                                <div className="space-y-2">
                                    <Label htmlFor={'statusCode'} className="">
                                        {'HTTP Status Code'}
                                    </Label>
                                    <Combobox
                                        options={httpStatusCodes}
                                        name="statusCode"
                                        value={statusCode}
                                        onChange={(value) =>
                                            formik.setFieldValue(
                                                'contentType',
                                                value
                                            )
                                        }
                                        className="w-full focus:ring-igrp focus:border-igrp h-9"
                                        placeholder="e.g., 200, 400"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={'name'} className="">
                                        {'Name'}
                                    </Label>
                                    <Input
                                        name={t('name')}
                                        value={name}
                                        placeholder=""
                                        onChange={(value) =>
                                            formik.setFieldValue('name', value)
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor={'contentType'} className="">
                                        {'Content Type'}
                                    </Label>
                                    <Combobox
                                        name={t('contentType')}
                                        value={contentType}
                                        placeholder="Select Content Type"
                                        onChange={(value) =>
                                            formik.setFieldValue(
                                                'contentType',
                                                value
                                            )
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
                            <div className="space-y-2">
                                <Label>Descritpion</Label>
                                <Input
                                    type="text"
                                    name="description"
                                    value={description}
                                    onChange={(value) =>
                                        formik.setFieldValue(
                                            'description',
                                            value
                                        )
                                    }
                                    className="w-full"
                                />
                            </div>

                            <Card className="rounded">
                                <CardHeader>
                                    <CardTitle>Data Schema</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <JSONSchemaBuilder
                                        schemaTypes={schemaTypes}
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
