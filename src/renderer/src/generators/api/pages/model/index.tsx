import { Card } from '@renderer/components/ui/card';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@renderer/components/ui/tabs';
import { Label } from '@renderer/components/ui/label';
import { Checkbox } from '@renderer/components/ui/checkbox';
import { TextInput } from '../../components/inputs-form';
import NavigationBar from '../../components/navigation-bar';
import { useModel } from './useModel';
import { FormList } from '../../components/form-list';
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
        handleNameBlur
    } = useModel({ selectors, currentItem });

    const { t } = useTranslation();

    const renderFormList = (value: string) => {
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
                btnLabels={btnLabels[value]}
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
                <Card className="p-6 rounded-sm">
                    <div className="space-y-6">
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
                                <Checkbox
                                    id="audit"
                                    onCheckedChange={(checked) =>
                                        formik.setFieldValue('audit', checked)
                                    }
                                    checked={formik.values.audit}
                                />
                                <Label htmlFor="audit">{t('auditModel')}</Label>
                            </div>

                            {enableEntityRevision && (
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="revision"
                                        onCheckedChange={(checked) =>
                                            formik.setFieldValue(
                                                'revision',
                                                checked
                                            )
                                        }
                                        checked={formik.values.revision}
                                    />
                                    <Label htmlFor="revision">
                                        {t('revision')}
                                    </Label>
                                </div>
                            )}
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="crud"
                                    onCheckedChange={(checked) =>
                                        formik.setFieldValue('crud', checked)
                                    }
                                    checked={formik.values.crud}
                                />
                                <Label htmlFor="Crud">{t('crud')}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="graphql" disabled />
                                <Label htmlFor="graphql">
                                    {t('graphql')}
                                    <span className="ml-2 text-xs text-muted-foreground">
                                        ({t('comingSoon')})
                                    </span>
                                </Label>
                            </div>
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
        </form>
    );
};

export default ModelLayout;
