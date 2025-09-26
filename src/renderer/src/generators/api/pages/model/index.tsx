import {
    IGRPCardContentPrimitive,
    IGRPCardPrimitive,
    IGRPCheckboxPrimitive,
    IGRPLabelPrimitive,
    IGRPTabsPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import {
    IGRPTabsContentPrimitive,
    IGRPTabsListPrimitive,
    IGRPTabsTriggerPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { TextInput } from '../../components/inputs-form';
import NavigationBar from '../../components/navigation-bar';
import { useModel } from './useModel';
import { FormList } from '../../../../components/form-list';
import { addNewRow, handleChangeValueObject, removeRow } from '../../helpers';
import { btnLabels, defaultValues, TabList } from './config';
import { useTranslation } from 'react-i18next';

interface ModelProps {
    selectors: Array<any>;
    currentItem: any;
    onCloseTab: () => void;
}

const ModelLayout = ({ selectors, currentItem, onCloseTab }: ModelProps) => {
    const {
        formik,
        data,
        enableEntityRevision,
        tablesColumns,
        deleteModel,
        onClickSourceCode,
        handleNameBlur,
    } = useModel({ selectors, currentItem });

    const { t } = useTranslation();

    const renderFormList = (value: string): React.ReactNode => {
        const columns = tablesColumns?.[value];
        const errors = formik?.errors?.[value];
        const touched = formik?.touched?.[value];

        if (!columns || !formik?.values?.[value]) return null;

        return (
            <FormList
                columns={columns}
                formik={formik}
                data={formik.values[value]}
                changeValue={(element, position, result) =>
                    handleChangeValueObject(
                        formik,
                        element,
                        position,
                        result,
                        value
                    )
                }
                errors={errors}
                touched={touched}
                addRow={() => addNewRow(formik, value, defaultValues[value])}
                removeRow={(position) => removeRow(formik, value, position)}
                btnLabels={btnLabels[value as keyof typeof btnLabels]}
                name={value}
            />
        );
    };

    return (
        <form onSubmit={formik.handleSubmit}>
            <NavigationBar
                onDelete={() => {
                    deleteModel();
                    onCloseTab();
                }}
                isNew={data === null}
                title={t('model')}
                showSourceCode={onClickSourceCode}
            />
            <div className="space-y-4 p-4">
                <IGRPCardPrimitive>
                    <IGRPCardContentPrimitive>
                        <div className="flex flex-col gap-4">
                            <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4">
                                <TextInput
                                    label={t('name')}
                                    id="name"
                                    placeholder={t('nameOfTheModel')}
                                    value={formik.values.name}
                                    onChange={formik.handleChange}
                                    onBlur={handleNameBlur}
                                    isTouched={formik.touched.name}
                                    error={formik.errors.name}
                                    isRequired
                                />

                                <TextInput
                                    label={t('tableName')}
                                    id="tableName"
                                    placeholder={t('enterTableName')}
                                    value={formik.values.tableName}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    isTouched={formik.touched.tableName}
                                    error={formik.errors.tableName}
                                    isRequired
                                />
                            </div>
                            <div className="grid xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-4 mb-4">
                                <div className="flex items-center space-x-2">
                                    <IGRPCheckboxPrimitive
                                        id="audit"
                                        onCheckedChange={(checked) =>
                                            formik.setFieldValue(
                                                'audit',
                                                checked
                                            )
                                        }
                                        checked={formik.values.audit}
                                    />
                                    <IGRPLabelPrimitive htmlFor="audit">
                                        {t('auditModel')}
                                    </IGRPLabelPrimitive>
                                </div>

                                {enableEntityRevision && (
                                    <div className="flex items-center space-x-2">
                                        <IGRPCheckboxPrimitive
                                            id="revision"
                                            onCheckedChange={(checked) =>
                                                formik.setFieldValue(
                                                    'revision',
                                                    checked
                                                )
                                            }
                                            checked={formik.values.revision}
                                        />
                                        <IGRPLabelPrimitive htmlFor="revision">
                                            {t('revision')}
                                        </IGRPLabelPrimitive>
                                    </div>
                                )}
                                <div className="flex items-center space-x-2">
                                    <IGRPCheckboxPrimitive
                                        id="crud"
                                        onCheckedChange={(checked) =>
                                            formik.setFieldValue(
                                                'crud',
                                                checked
                                            )
                                        }
                                        checked={formik.values.crud}
                                    />
                                    <IGRPLabelPrimitive htmlFor="Crud">
                                        {t('crud')}
                                    </IGRPLabelPrimitive>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <IGRPCheckboxPrimitive
                                        id="graphql"
                                        disabled
                                    />
                                    <IGRPLabelPrimitive htmlFor="graphql">
                                        {t('graphql')}
                                        <span className="ml-2 text-xs text-muted-foreground">
                                            ({t('comingSoon')})
                                        </span>
                                    </IGRPLabelPrimitive>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <IGRPCheckboxPrimitive
                                        id="odata"
                                        disabled
                                    />
                                    <IGRPLabelPrimitive htmlFor="odata">
                                        {t('odata')}
                                        <span className="ml-2 text-xs text-muted-foreground">
                                            ({t('comingSoon')})
                                        </span>
                                    </IGRPLabelPrimitive>
                                </div>
                            </div>
                        </div>
                    </IGRPCardContentPrimitive>
                </IGRPCardPrimitive>
                <IGRPCardPrimitive>
                    <IGRPCardContentPrimitive>
                        <IGRPTabsPrimitive defaultValue="attributes">
                            <IGRPTabsListPrimitive className="grid w-full grid-cols-3">
                                {TabList.map(({ value }, key) => (
                                    <IGRPTabsTriggerPrimitive
                                        key={key}
                                        value={value}
                                    >
                                        {t(value)}
                                    </IGRPTabsTriggerPrimitive>
                                ))}
                            </IGRPTabsListPrimitive>
                            {TabList.map(({ value }, key) => (
                                <IGRPTabsContentPrimitive
                                    key={key}
                                    value={value}
                                >
                                    <div className="border rounded-lg pb-2">
                                        {renderFormList(value)}
                                    </div>
                                </IGRPTabsContentPrimitive>
                            ))}
                        </IGRPTabsPrimitive>
                    </IGRPCardContentPrimitive>
                </IGRPCardPrimitive>
            </div>
        </form>
    );
};

export default ModelLayout;
