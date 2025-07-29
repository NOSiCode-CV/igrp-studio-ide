import { Card } from '@renderer/components/ui/card';
import { SelectInput, TextInput } from '../../components/inputs-form';
import NavigationBar from '../../components/navigation-bar';
import {
    addNewRow,
    getOptionsByObject,
    handleChangeValueObject,
    removeRow,
} from '../../helpers';
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
    const {
        formik,
        tablesColumns,
        data,
        dto,
        handleDelete,
        onClickSourceCode,
    } = useDto({ selectors, currentItem });

    const { t } = useTranslation();

    const renderFormList = (value: string) => {
        const columns = tablesColumns?.[value];
        const data = (formik?.values as any)?.[value];
        const errors = (formik?.errors as any)?.[value];
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

    const dtos = getOptionsByObject(
        dto,
        currentItem.module,
        currentItem?.content?.name
    );

    const handleChangeExtends = (option: string) =>
        formik.setFieldValue('extends', {
            name: option.split('-')[0],
            module: option.split('-')[1],
        });

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
                                label={t('template')}
                                id="template"
                                options={TemplateOptions}
                                value={formik.values.template}
                                onChange={(e) => {
                                    formik.setFieldValue('template', e);
                                }}
                                onBlur={formik.handleBlur}
                                error={formik.errors.template}
                                isTouched={formik.touched.template}
                                isRequired
                            />
                            <SelectInput
                                id="extends"
                                label={'extends'}
                                value={`${formik.values.extends?.name}-${formik.values.extends?.module}`}
                                options={
                                    dtos && dtos.length > 0
                                        ? dtos.map(
                                              ({ label, module, value }: { label: string, module: string, value: string }) => ({
                                                  label: `${label} (${module})`,
                                                  value: `${value}-${module}`,
                                              })
                                          )
                                        : []
                                }
                                onChange={(option: string | boolean) =>
                                    typeof option === 'string' && handleChangeExtends(option)
                                }
                                onBlur={formik.handleBlur}
                                error={formik.errors.extends}
                                isTouched={formik.touched.extends}
                            />
                            <div className="flex flex-1 space-x-2">
                                <Label htmlFor="enableCustonValidation">
                                    {t('enableCustonValidation')}
                                </Label>
                                <Checkbox
                                    id="enableCustonValidation"
                                    onCheckedChange={(checked: boolean) =>
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
                            <div
                                className="border pt-3 rounded-sm gap-0 p-0"
                                key={value}
                            >
                                {renderFormList(value)}
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </form>
    );
};

export default DtoLayout;
