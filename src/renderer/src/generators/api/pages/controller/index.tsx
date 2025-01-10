import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import { IColumnsTabelProps } from '../../types/Interfaces';
import { getTablesColumns, TabList, initialValues } from './config';

import { useDispatch } from 'react-redux';
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks';
import { useActionValidation } from './validation';
import { useTranslation } from 'react-i18next';
import {
    ControllerAction,
    ControllerConfig,
} from '@igrp/spring-engine/dist/interfaces/types';
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
import { Combobox } from '@igrp/igrp-design-system';
import { formatMethods } from '../../helpers';
import { TabRequest } from './tab-resquest';

import useToast from '@renderer/components/useToast';
import NavigationBar from '../../components/navigation-bar';
import { CreateEndpointDialog } from './create-endpoint-dialog';
import { TextInput } from '../../components/inputs-form';
import { Label } from '@renderer/components/ui/label';
import { TabResponse } from './tab-response';
import { ENV_TYPES, httpMethods } from '@renderer/constants/appConstants';
import { ContainerScrollArea } from '../../components/ContainerScrollArea';

interface ControllerProps {
    basePath: string;
    selectors: Array<any>;
    currentItem: any;
    modules: Array<any>;
    responses: Array<any>;
    onCloseTab: () => void;
    onUpdateTab: (newId: string) => void;
}

const ControllerLayout: React.FC<ControllerProps> = ({
    basePath,
    selectors,
    currentItem,
    modules,
    onCloseTab,
    onUpdateTab,
    responses,
}: ControllerProps) => {
    const { t } = useTranslation();

    const [oldActionName, setOldActionName] = useState('');
    const [title, setTitle] = useState('');
    const [name, setName] = useState('');
    const [pathController, setPathController] = useState('');
    const [module, setModule] = useState<string | undefined>();
    const [data, setData] = useState<any>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const dispatch: any = useDispatch();

    const [tablesColumns, setTableColumns] = useState<{
        [value: string]: IColumnsTabelProps[];
    }>({});

    const { showErrorToast, showSuccessToast } = useToast();

    const validationSchema = useActionValidation({ t });

    const formik: any = useFormik({
        enableReinitialize: true,
        initialValues,
        validationSchema,
        onSubmit: (_values, actions) => {
            actions.setSubmitting(false);
            handleSave();
        },
    });

    const getJsonData = async () => {
        if (!currentItem) return;

        try {
            const data = await window.api.getJsonContent(currentItem.path);
            setData(data);
        } catch (error) {
            console.error('Failed to load JSON content:', error);
        }
    };

    useEffect(() => {
        getJsonData();
    }, [currentItem]);

    useEffect(() => {
        const res = getTablesColumns(selectors);
        setTableColumns(res);
    }, [selectors]);

    useEffect(() => {
        if (data) {
            const { name, basePath } = data;

            setTitle(`${name}(${basePath})`);
            setName(name);
            setPathController(basePath);
        }
    }, [data]);

    useEffect(() => {
        if (currentItem && currentItem.content) {
            const {
                actionName,
                path,
                method,
                pathVariables,
                requestParams,
                headers,
            } = currentItem.content;

            setOldActionName(actionName);

            formik.setFieldValue(
                'actionName',
                actionName || initialValues.actionName
            );
            formik.setFieldValue('method', method || initialValues.method);
            formik.setFieldValue('path', path || initialValues.path);
            formik.setFieldValue(
                'pathVariables',
                pathVariables || initialValues.pathVariables
            );
            formik.setFieldValue(
                'requestParams',
                requestParams || initialValues.requestParams
            );
            formik.setFieldValue('headers', headers || initialValues.headers);
        }
        if (currentItem) {
            setModule(currentItem.module);
        }
    }, [currentItem]);

    const getValuesToSubmit = async () => {
        const values = { ...formik.values };

        if (!values.requestBody) delete values.requestBody;

        getJsonData();

        const actionName = oldActionName || values.actionName;

        const validPathVariables =
            values.pathVariables &&
            values.pathVariables.filter((item) => item.type && item.name);

        // Filter out invalid requestParams
        const validRequestParams =
            values.requestParams &&
            values.requestParams.filter((item) => item.type && item.name);

        const validHeaders =
            values.headers &&
            values.headers.filter((item) => item.type && item.header);

        const newAction = {
            ...values,
            pathVariables: validPathVariables,
            requestParams: validRequestParams,
            headers: validHeaders,
        };

        // Check if a matching action exists in data?.actions
        const existingActions = data?.actions || [];
        const isActionExisting = existingActions.some(
            (dataAction) => dataAction.actionName === oldActionName
        );

        // Merge or replace actions
        const mergedActions = existingActions.map((dataAction) =>
            dataAction.actionName === actionName ? newAction : dataAction
        );

        // If no matching action, add the new action
        const finalActions: ControllerAction[] = isActionExisting
            ? mergedActions
            : [...existingActions, newAction];

        const newValues: ControllerConfig = {
            type: 'controller',
            name: name,
            basePath: pathController,
            actions: finalActions,
            module,
        };

        return newValues;
    };

    const handleSave = async (): Promise<void> => {
        try {
            const values = await getValuesToSubmit();

            const { error } = await window.api.createController(
                values,
                basePath
            );

            console.log(values, error);

            onUpdateTab(formik.values.name);

            if (error) {
                showErrorToast(error);
                return;
            }

            dispatch(onSetChangeStatus(true));

            showSuccessToast(
                t('createdSuccess', {
                    name: t('controller'),
                    value: values.name,
                })
            );
        } catch (error: unknown) {
            showErrorToast(error);
        }
    };

    const handleDelete = async (): Promise<void> => {
        try {
            const values = await getValuesToSubmit();
            const countActions = values.actions.length;

            if (countActions === 1) {
                const config = {
                    name: formik.values.name,
                    type: 'controller',
                    module: currentItem.module,
                };

                const { error } = await window.engine.delete(
                    config,
                    ENV_TYPES.SPRING,
                    basePath
                );

                if (error) {
                    showErrorToast(error);
                    return;
                }
            } else {
                // Remove only the current action and save the updated actions
                const updatedActions = values.actions.filter(
                    (dataAction) => dataAction.actionName !== formik.actionName
                );

                const updatedValues = {
                    ...values,
                    actions: updatedActions,
                };

                const { error } = await window.api.createController(
                    updatedValues,
                    basePath
                );

                if (error) {
                    showErrorToast(error);
                    return;
                }
            }

            // Notify of successful deletion or update
            dispatch(onSetChangeStatus(true));
            onCloseTab();
            showSuccessToast(t('deletedSuccess', { name: t('controller') }));
        } catch (error) {
            showErrorToast(error);
        }
    };

    const typesData = formatMethods(
        (
            selectors.find((selector) => 'MYME_TYPES' in selector) as
                | { MYME_TYPES: string[] }
                | undefined
        )?.MYME_TYPES || []
    );

    const schemaTypes = formatMethods(
        (
            selectors.find((selector) => 'SCHEMA_TYPES' in selector) as
                | { SCHEMA_TYPES: string[] }
                | undefined
        )?.SCHEMA_TYPES || []
    );

    const onSubmit = async () => {
        const errors = await formik.validateForm();
        if (Object.keys(errors).length === 0) {
            // No validation errors, proceed with submit
            if (name && module && module !== 'shared') {
                formik.handleSubmit();
            } else {
                setIsModalOpen(true);
            }
        } else {
            // Handle validation errors (optional)
            console.error('Validation errors:', errors);
        }
    };

    return (
        <React.Fragment>
            <NavigationBar
                onDelete={handleDelete}
                onSubmit={onSubmit}
                isNew={!data}
                title={title || 'Create a new Action'}
            />

            <CreateEndpointDialog
                isOpen={isModalOpen}
                basePath={basePath}
                mode="formik"
                onConfirm={(values) => {
                    setName(values.name);
                    setPathController(values.basePath);
                    setModule(values.module);

                    formik.handleSubmit();
                }}
                onClose={() => setIsModalOpen(false)}
                modules={modules}
                defaultModule={module}
            />
            <ContainerScrollArea size="lg">
                <div className="space-y-4 p-4">
                    <Card className="rounded">
                        <CardHeader>
                            <CardTitle>Definition</CardTitle>
                            <CardDescription>
                                Provide the name and configuration for this
                                action
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-4">
                                <div className="space-y-3">
                                    <Label
                                        htmlFor={'method'}
                                        className="block text-sm font-medium text-gray-700"
                                    >
                                        {'Method Type'}
                                    </Label>
                                    <Combobox
                                        name={t('method')}
                                        placeholder={t('Enter Method')}
                                        value={formik.values.method}
                                        onChange={(value) =>
                                            formik.setFieldValue(
                                                'method',
                                                value
                                            )
                                        }
                                        options={httpMethods}
                                        className="h-9 w-full"
                                    />
                                </div>

                                <TextInput
                                    label={'Path'}
                                    id={t('path')}
                                    placeholder={t('/posts/[id]')}
                                    value={formik.values.path}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    error={formik.errors['path']}
                                />
                                <TextInput
                                    id={'actionName'}
                                    label={t('Action Name')}
                                    placeholder={t('getPosts')}
                                    value={formik.values.actionName}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    error={formik.errors['actionName']}
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
                            />
                        </TabsContent>
                        <TabsContent value={'response'}>
                            <TabResponse
                                formik={formik}
                                schemaTypes={schemaTypes}
                                contentTypes={typesData}
                                responseTypes={responses}
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            </ContainerScrollArea>
        </React.Fragment>
    );
};

export default ControllerLayout;
