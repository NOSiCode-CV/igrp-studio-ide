import { useEffect, useState } from 'react';
import useToast from '@renderer/components/useToast';
import { useFormik } from 'formik';
import {
    btnLabels,
    defaultValues,
    getTablesColumns,
    TabList,
    initialValues,
    getValuesToSubmit,
} from './config';
import { IColumnsTabelProps } from '../../types/Interfaces';
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks';
import { useDispatch } from 'react-redux';
import { useModelValidation } from './validation';
import { useTranslation } from 'react-i18next';
import { Card } from '@renderer/components/ui/card';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@renderer/components/ui/tabs';
import { Label } from '@renderer/components/ui/label';
import { addNewRow, changeValue, removeRow } from '../../helpers';
import { TextInput } from '../../components/inputs-form';
import { Checkbox } from '@renderer/components/ui/checkbox';
import NavigationBar from '../../components/navigation-bar';
import { FormList } from '../../components/form-list';
import { ENV_TYPES, OPTION_TYPE } from '@renderer/constants/appConstants';
import { useGit } from '@renderer/hooks/useGit';
import { useTabs } from '@renderer/components/TabContext';

interface ModelProps {
    basePath: string;
    selectors: Array<any>;
    models?: Array<any>;
    currentItem: any;
    onCloseTab: () => void;
    onUpdateTab: (tabId: string) => void;
}

const ModelLayout = ({
    basePath,
    selectors,
    models,
    currentItem,
    onCloseTab,
    onUpdateTab,
}: ModelProps): JSX.Element => {
    const { createGitCommit } = useGit();
    const { initializeTabFromCurrentItem } = useTabs();
    const { t } = useTranslation();
    const dispatch: any = useDispatch();
    const [tablesColumns, setTableColumns] = useState<{
        [value: string]: IColumnsTabelProps[];
    }>({});
    const { showErrorToast, showSuccessToast } = useToast();
    const [data, setData] = useState<any>(null);

    const validationSchema = useModelValidation({ t });

    const formik: any = useFormik({
        enableReinitialize: true,
        initialValues,
        validationSchema,
        onSubmit: (_values, actions) => {
            actions.setSubmitting(false);
            handleSave();
        },
    });

    const suggestTableName = (name) => {
        return `t_${name
            .replace(/([a-z])([A-Z])/g, '$1_$2')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '_')}`;
    };

    const handleNameBlur = (e) => {
        formik.handleBlur(e);
        const name = e.target.value;
        if (!formik.values.tableName) {
            formik.setFieldValue('tableName', suggestTableName(name));
        }
    };

    useEffect(() => {
        const res = getTablesColumns({
            selectors,
            attributes: formik.values.attributes,
            models,
        });
        setTableColumns(res);
    }, [selectors, formik.values]);

    useEffect(() => {
        const getJsonData = async () => {
            if (!currentItem) return;

            try {
                const data = await window.api.getJsonContent(currentItem.path);
                setData(data);
            } catch (error) {
                console.error('Failed to load JSON content:', error);
            }
        };

        getJsonData();
    }, [currentItem]);

    useEffect(() => {
        if (data) {
            const {
                name,
                tableName,
                attributes,
                crud,
                primaryKey,
                uniqueConstraints,
                indexes,
            } = data;

            const primaryKeyAttributes =
                primaryKey && Array.isArray(primaryKey)
                    ? primaryKey.map((pk) => ({
                          ...defaultValues.attributes,
                          ...pk,
                          primaryKey: true,
                      }))
                    : [];

            const attributesTransf = attributes.map(({ ...field }) => ({
                ...field,
                nullable: !field.nullable,
            }));

            const mergedAttributes = [
                ...attributesTransf,
                ...primaryKeyAttributes,
            ];

            const constraints =
                uniqueConstraints && uniqueConstraints.length > 0
                    ? uniqueConstraints
                    : [defaultValues.uniqueConstraints];

            const indexesTable =
                indexes && indexes.length > 0
                    ? indexes
                    : [defaultValues.indexes];

            formik.setFieldValue('name', name || '');
            formik.setFieldValue('tableName', tableName || '');
            formik.setFieldValue('crud', crud || false);
            formik.setFieldValue(
                'attributes',
                mergedAttributes || [defaultValues.attributes]
            );
            formik.setFieldValue('uniqueConstraints', constraints);
            formik.setFieldValue('indexes', indexesTable);
        } else formik.resetForm();
    }, [data]);

    const handleSave = async (): Promise<void> => {
        try {
            const values = getValuesToSubmit(
                { ...formik.values, id: currentItem.id },
                currentItem?.module || 'shared'
            );

            const { error } = await window.api.createModel(values, basePath);

            if (error) {
                showErrorToast(error);
                return;
            }

            dispatch(onSetChangeStatus(true));

            onUpdateTab(formik.values.name);

            showSuccessToast(
                t('createdSuccess', { name: t('model'), value: values.name })
            );
        } catch (error) {
            showErrorToast(error);
        }
    };

    const deleteModel = async (): Promise<void> => {
        try {
            const config = {
                name: formik.values.name,
                type: 'model',
                module: currentItem.module,
                id: currentItem.id,
            };

            const { error } = await window.engine.delete(
                config,
                ENV_TYPES.SPRING,
                basePath
            );

            if (error) return showErrorToast(error);

            createGitCommit(basePath, `Add schema ${formik.values.name}`);

            dispatch(onSetChangeStatus(true));

            onCloseTab();

            createGitCommit(basePath, `Delete schema ${formik.values.name}`);

            showSuccessToast(t('deletedSuccess', { name: t('model') }));
        } catch (error) {
            showErrorToast(error);
        }
    };

    const onClickSourceCode = () => {
        initializeTabFromCurrentItem({
            path: `${currentItem.path}`,
            type: OPTION_TYPE.FILE_THREE,
            label: `${currentItem.label}.json`,
        });
    };

    const renderFormList = (value: string) => {
        const columns = tablesColumns?.[value];
        const errors = formik?.errors?.[value];
        const touched = formik?.touched?.[value];

        return (
            <>
                {columns && formik?.values?.[value] && (
                    <FormList
                        columns={columns}
                        formik={formik}
                        data={formik.values[value]}
                        changeValue={(element, position, result) =>
                            changeValue(
                                formik,
                                element,
                                position,
                                result,
                                value
                            )
                        }
                        errors={errors}
                        touched={touched}
                        addRow={() =>
                            addNewRow(formik, value, defaultValues[value])
                        }
                        removeRow={(position) =>
                            removeRow(formik, value, position)
                        }
                        btnLabels={btnLabels[value]}
                        name={value}
                    />
                )}
            </>
        );
    };

    return (
        <>
            <NavigationBar
                onDelete={deleteModel}
                onSubmit={formik.handleSubmit}
                isNew={data === null}
                title={t('model')}
                showSourceCode={onClickSourceCode}
            />
            <div className="space-y-4 p-4">
                <Card className="p-6 rounded-sm">
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-4">
                                <TextInput
                                    label={t('name')}
                                    id="name"
                                    placeholder={t('nameOfTheModel')}
                                    value={formik.values.name}
                                    onChange={formik.handleChange}
                                    onBlur={handleNameBlur}
                                    error={
                                        formik.touched.name
                                            ? formik.errors.name
                                            : undefined
                                    }
                                    isRequired
                                />

                                <TextInput
                                    label={t('tableName')}
                                    id="tableName"
                                    placeholder={t('enterTableName')}
                                    value={formik.values.tableName}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    error={
                                        formik.touched.tableName
                                            ? formik.errors.tableName
                                            : undefined
                                    }
                                    isRequired
                                />
                            </div>
                        </div>
                        <div className="flex">
                            <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-4 mb-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="audit"
                                        onCheckedChange={(checked) =>
                                            formik.setFieldValue(
                                                'audit',
                                                checked
                                            )
                                        }
                                        checked={formik.values.audit}
                                    />
                                    <Label htmlFor="audit">
                                        {t('auditModel')}
                                    </Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="crud"
                                        onCheckedChange={(checked) =>
                                            formik.setFieldValue(
                                                'crud',
                                                checked
                                            )
                                        }
                                        checked={formik.values.crud}
                                    />
                                    <Label htmlFor="Crud">{t('crud')}</Label>
                                </div>
                                {/* New GraphQL Option (Coming Soon) */}
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="graphql" disabled />
                                    <Label htmlFor="graphql">
                                        {t('graphql')}
                                        <span className="ml-2 text-xs text-muted-foreground">
                                            ({t('comingSoon')})
                                        </span>
                                    </Label>
                                </div>

                                {/* New OData Option (Coming Soon) */}
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="odata" disabled />
                                    <Label htmlFor="odata">
                                        {t('odata')}
                                        <span className="ml-2 text-xs text-muted-foreground">
                                            ({t('comingSoon')})
                                        </span>
                                    </Label>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 rounded-sm">
                    <Tabs defaultValue="attributes">
                        <TabsList className="grid w-full grid-cols-3">
                            {TabList.map(({ value }, key) => (
                                <TabsTrigger key={key} value={value}>
                                    {t(value)}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        {TabList.map(({ value }, key) => (
                            <TabsContent key={key} value={value}>
                                <Card className="rounded-sm">
                                    {renderFormList(value)}
                                </Card>
                            </TabsContent>
                        ))}
                    </Tabs>
                </Card>
            </div>
        </>
    );
};

export default ModelLayout;
