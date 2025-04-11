import { Card } from '@renderer/components/ui/card';
import { SelectInput, TextInput } from '../../components/inputs-form';
import NavigationBar from '../../components/navigation-bar';
import { addNewRow, handleChangeValueObject, removeRow } from '../../helpers';
import { initialValues, TabList, TemplateOptions } from './config';
import AttributesCard from './attributes';
import { useTranslation } from 'react-i18next';
import { useDto } from './useDto';
import { Checkbox } from '@renderer/components/ui/checkbox';
import { Label } from '@renderer/components/ui/label';

interface DtoProps {
    selectors: Array<any>;
    currentItem: any;
    onCloseTab: () => void;
}

const DtoLayout = ({ selectors, currentItem, onCloseTab }: DtoProps) => {
    const { formik, tablesColumns, data, handleDelete, onClickSourceCode } =
        useDto({ selectors, currentItem });

    const { t } = useTranslation();

    const renderFormList = (value: string) => {
        const columns = tablesColumns?.[value];
        const data = formik?.values?.[value];
        const errors = formik?.errors?.[value];
        const dValues = initialValues.attributes[0];

        if (columns && data) {
            return (
                <AttributesCard
                    columns={columns}
                    formik={formik}
                    data={data}
                    errors={errors}
                    addRow={() => addNewRow(formik, value, dValues)}
                    removeRow={(position) => removeRow(formik, value, position)}
                    changeValue={(element, position, result) => {
                        handleChangeValueObject(
                            formik,
                            element,
                            position,
                            result,
                            value
                        );
                    }}
                />
            );
        }
        return null;
    };

    return (
        <form onSubmit={formik.handleSubmit}>
            <NavigationBar
                onDelete={() => {
                    handleDelete();
                    onCloseTab();
                }}
                showSourceCode={onClickSourceCode}
                isNew={!data}
                title={t('dto')}
            />
            <div className="space-y-4 p-4">
                <Card className="rounded-sm p-6">
                    <div className="flex flex-col gap-4">
                        <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4">
                            <TextInput
                                label={t('name')}
                                id="name"
                                placeholder={t('enterName')}
                                value={formik.values.name}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                isTouched={formik.touched.name}
                                error={formik.errors.name}
                                isRequired
                            />
                            <SelectInput
                                label={'Template'}
                                id="template"
                                options={TemplateOptions}
                                value={formik.values.template}
                                onChange={(option) =>
                                    formik.setFieldValue('template', option)
                                }
                                onBlur={(option) =>
                                    formik.setFieldValue('template', option)
                                }
                                error={formik.errors.template}
                                isTouched={formik.touched.template}
                                isRequired
                            />
                            <div className="flex flex-col space-y-2">
                                <Label htmlFor="enableCustonValidation">
                                    {t('enableCustonValidation')}
                                </Label>
                                <Checkbox
                                    id="enableCustonValidation"
                                    onCheckedChange={(checked) =>
                                        formik.setFieldValue(
                                            'enableCustonValidation',
                                            checked
                                        )
                                    }
                                    checked={
                                        formik.values.enableCustonValidation
                                    }
                                />
                            </div>
                        </div>
                        {TabList.map(({ value }) => (
                            <Card className="rounded-sm gap-0" key={value}>
                                {renderFormList(value)}
                            </Card>
                        ))}
                    </div>
                </Card>
            </div>
        </form>
    );
};

export default DtoLayout;
