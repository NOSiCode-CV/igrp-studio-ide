import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@renderer/components/ui/card';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@renderer/components/ui/tabs';
import { IGRPInputAddOn } from '@igrp/igrp-framework-react-design-system';
import { cn } from '@renderer/lib/utils';
import { TextInput } from '../../components/inputs-form';
import NavigationBar from '../../components/navigation-bar';
import { CreateEndpointDialog } from './create-endpoint-dialog';
import { TabRequest } from './tab-resquest';
import { TabResponse } from './tab-response';
import { useController } from './useController';
import { TabList } from './config';
import { httpMethods } from '@renderer/constants/appConstants';
import { useTranslation } from 'react-i18next';

interface ControllerProps {
    selectors: Array<any>;
    currentItem: any;
    onCloseTab: () => void;
}

export const ControllerLayout: React.FC<ControllerProps> = ({
    selectors,
    currentItem,
    onCloseTab,
}) => {
    const {
        basePath,
        formik,
        title,
        controller,
        setController,
        isModalOpen,
        setIsModalOpen,
        tablesColumns,
        typesData,
        collectionType,
        schemaTypes,
        enumTypes,
        responses,
        modules,
        handleDelete,
        onClickSourceCode,
    } = useController({ selectors, currentItem });

    const { t } = useTranslation();

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                formik.handleSubmit();
            }}
        >
            <NavigationBar
                onDelete={() => {
                    handleDelete();
                    onCloseTab();
                }}
                isNew={!title}
                title={title || t('createNewAction')}
                showSourceCode={onClickSourceCode}
                onClickBreadcrumbLink={() => setIsModalOpen(true)}
            />

            <CreateEndpointDialog
                isOpen={isModalOpen}
                basePath={basePath}
                mode="formik"
                modules={modules}
                controller={controller}
                onConfirm={(values) => {
                    setController({
                        name: values.name,
                        description: values.description,
                        path: values.path,
                        module: values.module,
                    });
                    formik.handleSubmit();
                }}
                onClose={() => setIsModalOpen(false)}
            />
            <div className="space-y-4 p-4">
                <Card className="rounded">
                    <CardHeader>
                        <CardTitle>{t('definition')}</CardTitle>
                        <CardDescription>
                            {t('controllerDefinition')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4">
                            <div className="flex flex-col gap-3 md:col-span-2 space-y-2">
                                <IGRPInputAddOn
                                    id="method"
                                    selectValue={formik.values.method}
                                    value={formik.values.path}
                                    label={t('methodType')}
                                    options={httpMethods}
                                    placeholder={'posts/{id}'}
                                    onBlur={formik.handleBlur}
                                    onChange={(e) =>
                                        formik.setFieldValue(
                                            'path',
                                            e.target.value
                                        )
                                    }
                                    onSelectValueChange={(value) => {
                                        formik.setFieldValue('method', value || currentItem.content?.method);
                                    }}
                                    classNameGlobal={cn(
                                        'w-full h-8 mb-6',
                                        formik.touched.path &&
                                            formik.errors.path &&
                                            'border-red-500'
                                    )}
                                />
                                {formik.errors.path && formik.touched.path && (
                                    <p className="text-xs text-red-500">
                                        {formik.errors.path}
                                    </p>
                                )}
                            </div>
                            <TextInput
                                id={'actionName'}
                                label={t('actionName')}
                                placeholder={'getPosts'}
                                value={formik.values.actionName}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.errors.actionName}
                                isTouched={formik.touched.actionName}
                                isRequired
                            />
                        </div>
                    </CardContent>
                </Card>
                <Tabs defaultValue={'request'}>
                    <TabsList className="grid w-full grid-cols-4">
                        {TabList.map(({ label, tabId }, key) => (
                            <TabsTrigger key={key} value={tabId}>
                                {label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    <TabsContent value={'request'}>
                        <TabRequest
                            formik={formik}
                            tablesColumns={tablesColumns}
                            contentTypes={typesData}
                            schemaTypes={schemaTypes}
                            collectionTypes={collectionType}
                        />
                    </TabsContent>
                    <TabsContent value={'response'}>
                        <TabResponse
                            formik={formik}
                            schemaTypes={schemaTypes}
                            contentTypes={typesData}
                            responseTypes={responses}
                            enumTypes={enumTypes}
                            collectionTypes={collectionType}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </form>
    );
};
