import {
    IGRPCardContentPrimitive,
    IGRPCardPrimitive,
    IGRPCheckboxPrimitive,
    IGRPLabelPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { useTranslation } from 'react-i18next'
import { SelectInput, TextInput } from '../../components/inputs-form'
import NavigationBar from '../../components/navigation-bar'
import { useFramework } from '@renderer/hooks/use-framework'
import { addNewRow, getOptionsByObject, handleChangeValueObject, removeRow } from '../../helpers'
import AttributesCard from './attributes'
import { getInitialValues, KIND_OPTIONS, TabList, TemplateOptions } from './config'
import { useDto } from './useDto'

interface DtoProps {
    selectors: Array<any>
    currentItem: any
    onCloseTab: () => void
}

const DtoLayout = ({ selectors, currentItem, onCloseTab }: DtoProps) => {
    const { formik, tablesColumns, data, dto, handleDelete, onClickSourceCode } = useDto({
        selectors,
        currentItem
    })

    const { t } = useTranslation()
    const framework = useFramework()

    const renderFormList = (value: string) => {
        const columns = tablesColumns?.[value]
        const data = (formik?.values as any)?.[value]
        const errors = (formik?.errors as any)?.[value]
        // Template for new rows added via the "+" button. The framework-aware
        // bit is `objectType` (see `dto/config.ts`); the rest is identical
        // across engines.
        const dValues = getInitialValues(framework).attributes[0]

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
                        handleChangeValueObject(formik, element, position, result, value)
                    }}
                />
            )
        }
        return null
    }

    const dtos = getOptionsByObject(dto, currentItem.module, currentItem?.content?.name)

    const handleChangeExtends = (option: string) =>
        formik.setFieldValue('extends', {
            name: option.split('-')[0],
            module: option.split('-')[1]
        })

    return (
        <form onSubmit={formik.handleSubmit}>
            <NavigationBar
                onDelete={() => {
                    handleDelete()
                    onCloseTab()
                }}
                showSourceCode={onClickSourceCode}
                isNew={!data}
                title={t('dto')}
            />
            <div className="space-y-4 p-4">
                <IGRPCardPrimitive>
                    <IGRPCardContentPrimitive>
                        <div className="flex flex-col gap-4">
                            <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4">
                                <SelectInput
                                    label="Kind"
                                    id="type"
                                    options={KIND_OPTIONS}
                                    value={formik.values.type}
                                    onChange={(e) => {
                                        if (typeof e === 'string') {
                                            formik.setFieldValue('type', e)
                                        }
                                    }}
                                    onBlur={formik.handleBlur}
                                    error={formik.errors.type}
                                    isTouched={formik.touched.type}
                                    isRequired
                                />
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
                                        formik.setFieldValue('template', e)
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
                                                  ({
                                                      label,
                                                      module,
                                                      value
                                                  }: {
                                                      label: string
                                                      module: string
                                                      value: string
                                                  }) => ({
                                                      label: `${label} (${module})`,
                                                      value: `${value}-${module}`
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
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center space-x-2">
                                        <IGRPCheckboxPrimitive
                                            id="enableCustonValidation"
                                            onCheckedChange={(checked: boolean) =>
                                                formik.setFieldValue('enableCustonValidation', checked)
                                            }
                                            checked={formik.values.enableCustonValidation}
                                        />
                                        <IGRPLabelPrimitive htmlFor="enableCustonValidation" className="whitespace-nowrap">
                                            {t('enableCustonValidation')}
                                        </IGRPLabelPrimitive>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <IGRPCheckboxPrimitive
                                            id="readOnly"
                                            onCheckedChange={(checked: boolean) =>
                                                formik.setFieldValue('readOnly', checked)
                                            }
                                            checked={formik.values.readOnly}
                                        />
                                        <IGRPLabelPrimitive htmlFor="readOnly" className="whitespace-nowrap">
                                            {t('readOnly')}
                                        </IGRPLabelPrimitive>
                                    </div>
                                </div>
                            </div>
                            {TabList.map(({ value }) => (
                                <div className="border rounded-lg pb-2" key={value}>
                                    {renderFormList(value)}
                                </div>
                            ))}
                        </div>
                    </IGRPCardContentPrimitive>
                </IGRPCardPrimitive>
            </div>
        </form>
    )
}

export default DtoLayout
