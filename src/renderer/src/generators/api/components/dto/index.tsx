import React, { useEffect, useState } from 'react'
import { useFormik } from 'formik'
import { IColumnsTabelProps } from '../Interfaces'
import useToast from '@renderer/components/useToast'
import { getTablesColumns, TabList, TemplateOptions, initialValues } from './config'
import { DTOConfig } from '@igrp/spring-engine/dist/interfaces/types'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks'
import { useDtoValidation } from './validation'
import { Card } from '@renderer/components/ui/card'
import { addNewRow, changeValue, removeRow } from '../../helpers'
import { SelectInput, TextInput } from '../inputs-form'
import NavigationBar from '../navigation-bar'
import AttributesCard from './attributes'

interface DtoProps {
  jsonData?: any
  onCancel: () => void
  basePath: string
  module: string
  selectors: Array<any>
  models?: Array<any>
  dto?: Array<any>
}

const DtoLayout = ({
  jsonData,
  onCancel,
  basePath,
  selectors,
  dto,
  models,
  module
}: DtoProps): JSX.Element => {
  const dispatch: any = useDispatch()
  const { showErrorToast, showSuccessToast } = useToast()
  const { t } = useTranslation()

  const [tablesColumns, setTableColumns] = useState<{ [key: string]: IColumnsTabelProps[] }>({})
  const validationSchema = useDtoValidation({ t })

  const formik = useFormik({
    enableReinitialize: true,
    initialValues,
    validationSchema,
    onSubmit: async (values) => {
      await handleSave(values)
    }
  })

  useEffect(() => {
    if (jsonData) {
      const { name, template, attributes } = jsonData
      formik.setFieldValue('name', name || '')
      formik.setFieldValue('template', template || '')
      formik.setFieldValue('attributes', attributes || initialValues.attributes)
    } else {
      formik.resetForm()
    }
  }, [jsonData])

  useEffect(() => {
    const columns = getTablesColumns({ selectors, dto, models, currentDto: jsonData?.name })
    setTableColumns(columns)
  }, [selectors, dto, models, jsonData])

  const handleSave = async (newValues: DTOConfig): Promise<void> => {
    try {
      newValues.module = module

      const { error } = await window.api.createDto(newValues, basePath)
      if (error) return showErrorToast(error)

      dispatch(onSetChangeStatus(true))

      showSuccessToast(t('createdSuccess', { name: t('dto'), value: newValues.name }))
    } catch (error) {
      showErrorToast(error)
    }
  }

  const handleDelete = async (): Promise<void> => {
    try {
      const { error } = await window.api.deleteDTO(
        { type: 'dto', name: formik.values.name },
        basePath
      )
      if (error) return showErrorToast(error)

      dispatch(onSetChangeStatus(true))
      onCancel()
      showSuccessToast(t('deletedSuccess', { name: t('dto') }))
    } catch (error) {
      showErrorToast(error)
    }
  }

  const renderFormList = (value: string) => {
    const columns = tablesColumns?.[value]
    const data = formik?.values?.[value]
    const errors = formik?.errors?.[value]

	const dValues = initialValues.attributes[0]

    if (columns && data) {
      return (
        <AttributesCard
          dto={dto}
          models={models}
          currentDto={jsonData?.name}
          data={data}
          selectors={selectors}
          errors={errors}
          addRow={() => addNewRow(formik, value, dValues)}
          removeRow={(position) => removeRow(formik, value, position)}
          changeValue={(element, position, result) =>
            changeValue(formik, element, position, result, value)
          }
        />
      )
    }
    return null
  }

  return (
    <React.Fragment>
      <NavigationBar
        onDelete={handleDelete}
        onCancel={onCancel}
        onSubmit={formik.handleSubmit}
        isNew={!jsonData}
        title="dto"
      />

      <div className="space-y-4 p-4">
        <Card className="rounded-sm p-6">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-4 gap-5">
              <TextInput
                label={t('Name')}
                id="name"
                placeholder={t('Enter name')}
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name ? formik.errors.name : undefined}
              />
              <SelectInput
                label={t('Template')}
                id="template"
                options={TemplateOptions}
                value={TemplateOptions.find((opt) => opt.value === formik.values.template)}
                onChange={(option) => formik.setFieldValue('template', option?.value)}
                error={formik.errors.template}
              />
            </div>
            {TabList.map(({ value }) => (
              <Card className="rounded-sm" key={value}>
                {renderFormList(value)}
              </Card>
            ))}
          </div>
        </Card>
      </div>
    </React.Fragment>
  )
}

export default DtoLayout
