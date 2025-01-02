import { useEffect, useState } from 'react'
import { FormList } from '../form-list'
import useToast from '@renderer/components/useToast'
import { useFormik } from 'formik'
import { btnLabels, defaultValues, getTablesColumns, TabList, initialValues } from './config'
import { ModelConfig, Relation } from '@igrp/spring-engine/dist/interfaces/types'
import { IColumnsTabelProps } from '../../types/Interfaces'
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks'
import { useDispatch } from 'react-redux'
import { useModelValidation } from './validation'
import { useTranslation } from 'react-i18next'
import { Card } from '@renderer/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { Label } from '@renderer/components/ui/label'
import { addNewRow, changeValue, removeRow } from '../../helpers'
import { TextInput } from '../inputs-form'
import PrimaryKeyTable from './PrimaryKeyTable'
import { Checkbox } from '@renderer/components/ui/checkbox'
import NavigationBar from '../navigation-bar'

interface ModelProps {
  basePath: string
  selectors: Array<any>
  models?: Array<any>
  currentItem: any
  onCloseTab: () => void
  onUpdateTab: (tabId: string) => void
}

const ModelLayout = ({
  basePath,
  selectors,
  models,
  currentItem,
  onCloseTab,
  onUpdateTab
}: ModelProps): JSX.Element => {
  const { t } = useTranslation()
  const dispatch: any = useDispatch()
  const [tablesColumns, setTableColumns] = useState<{ [value: string]: IColumnsTabelProps[] }>({})
  const { showErrorToast, showSuccessToast } = useToast()
  const [data, setData] = useState<any>(null)

  const validationSchema = useModelValidation({ t })

  const formik: any = useFormik({
    enableReinitialize: true,
    initialValues,
    validationSchema,
    onSubmit: (_values, actions) => {
      actions.setSubmitting(false)
      handleSave()
    }
  })

  const suggestTableName = (name) => {
    return `t_${name.trim().toLowerCase().replace(/\s+/g, '_')}`
  }

  const handleNameBlur = (e) => {
    formik.handleBlur(e)
    const name = e.target.value
    if (!formik.values.tableName) {
      formik.setFieldValue('tableName', suggestTableName(name))
    }
  }

  useEffect(() => {
    const res = getTablesColumns({
      selectors,
      attributes: formik.values.attributes,
      models,
      currentModel: formik.values.name
    })
    setTableColumns(res)
  }, [selectors, formik.values])

  useEffect(() => {
    const getJsonData = async () => {
      if (!currentItem) return

      try {
        const data = await window.api.getJsonContent(currentItem.path)
        setData(data)
        //setOption(currentItem.subType || currentItem.type)
        //setModule(currentItem.module)
        //dispatch(setCurrentItem(null))
      } catch (error) {
        console.error('Failed to load JSON content:', error)
      }
    }

    getJsonData()
  }, [currentItem])

  useEffect(() => {
    if (data) {
      const {
        name,
        tableName,
        attributes,
        crud,
        primaryKey,
        relations,
        uniqueConstraints,
        indexes
      } = data

      const crudValue = crud ? [crud] : [defaultValues.crud]

      const firstNonEmptyGenerationType =
        attributes.find((attr) => attr.generationType)?.generationType || null

      const primaryKeyAttributes =
        primaryKey && Array.isArray(primaryKey)
          ? primaryKey.map((pk) => ({
              ...defaultValues.attributes,
              ...pk,
              primaryKey: true
            }))
          : []

      const attributesTransf = attributes.map(({ ...field }) => ({
        ...field,
        nullable: !field.nullable
      }))

      const mergedAttributes = [...attributesTransf, ...primaryKeyAttributes]

      const constraints =
        uniqueConstraints && uniqueConstraints.length > 0
          ? uniqueConstraints
          : [defaultValues.uniqueConstraints]

      const indexesTable = indexes && indexes.length > 0 ? indexes : [defaultValues.indexes]

      formik.setFieldValue('name', name || '')
      formik.setFieldValue('tableName', tableName || '')
      formik.setFieldValue('crud', crudValue)
      formik.setFieldValue('generationType', firstNonEmptyGenerationType)
      formik.setFieldValue('enableCrud', crud?.enabled || false)
      formik.setFieldValue('attributes', mergedAttributes || [defaultValues.attributes])
      formik.setFieldValue('relations', relations || [defaultValues.relations])
      formik.setFieldValue('uniqueConstraints', constraints)
      formik.setFieldValue('indexes', indexesTable)
    } else formik.resetForm()
  }, [data])

  const getValuesToSubmit = () => {
    const values = { ...formik.values }
    const enableCrud = values.enableCrud || false
    const generationType = values.generationType

    delete values.enableCrud
    delete values.generationType

    const relations: Relation[] = values.relations?.filter((rel) => rel.relationType !== '') || []

    const uniqueConstraints = values.uniqueConstraints?.filter((rel) => rel.name !== '') || []

    const indexes = values.indexes?.filter((idx) => idx.name !== '') || []

    const attributes = values.attributes.map(({ ...field }) => ({
      ...field,
      length: field.length ? Number(field.length) : 255,
      nullable: !field.nullable,
      generationType: field.primaryKey === true ? generationType : ''
    }))

    const primaryKey = values.attributes
      .filter((attribute) => attribute.primaryKey === true)
      .map(({ name, type }) => ({
        name,
        type
      }))

    const hasListPk = primaryKey.length > 1 ? true : false

    const filteredAttributes = hasListPk
      ? attributes.filter((attribute) => attribute.primaryKey !== true)
      : attributes

    const newValues: ModelConfig = {
      ...values,
      attributes: filteredAttributes,
      relations,
      uniqueConstraints,
      indexes,
      crud: {
        ...values.crud?.[0],
        enabled: enableCrud
      },
      primaryKey: hasListPk ? primaryKey : [],
      module: currentItem.module
    }

    if (!enableCrud && !newValues.crud?.path) delete newValues.crud

    return newValues
  }

  const handleSave = async (): Promise<void> => {
    try {
      const values = getValuesToSubmit()

      const { error } = await window.api.createModel(values, basePath)

      if (error) {
        showErrorToast(error)
        return
      }

      dispatch(onSetChangeStatus(true))

      onUpdateTab(formik.values.name)

      showSuccessToast(t('createdSuccess', { name: t('model'), value: values.name }))
    } catch (error) {
      showErrorToast(error)
    }
  }

  const deleteModel = async (): Promise<void> => {
    try {
      const values = getValuesToSubmit()

      const { error } = await window.api.deleteModel(values, basePath)

      if (error) {
        showErrorToast(error)
        return
      }

      dispatch(onSetChangeStatus(true))

      onCloseTab()

      showSuccessToast(t('deletedSuccess', { name: t('model') }))
    } catch (error) {
      showErrorToast(error)
    }
  }

  const renderFormList = (value: string) => {
    const columns = tablesColumns?.[value]
    const errors = formik?.errors?.[value]

    return (
      <>
        {columns && formik?.values?.[value] && (
          <FormList
            columns={columns}
            formik={formik}
            data={formik.values[value]}
            changeValue={(element, position, result) =>
              changeValue(formik, element, position, result, value)
            }
            errors={errors}
            addRow={
              value === 'crud' ? undefined : () => addNewRow(formik, value, defaultValues[value])
            }
            removeRow={
              value === 'crud' ? undefined : (position) => removeRow(formik, value, position)
            }
            btnLabels={btnLabels[value]}
            name={value}
          />
        )}
      </>
    )
  }

  return (
    <>
      <NavigationBar
        onDelete={deleteModel}
        onSubmit={formik.handleSubmit}
        isNew={data === null}
        title="model"
      />

      <div className="space-y-4 p-4">
        <Card className="p-6 rounded-sm">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="grid grid-cols-4 gap-5">
                <TextInput
                  label={t('Name')}
                  id="name"
                  placeholder={t('Name of the model')}
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={handleNameBlur}
                  error={formik.touched.name ? formik.errors.name : undefined}
                />

                <TextInput
                  label={t('Table Name')}
                  id="tableName"
                  placeholder={t('Enter Table Name')}
                  value={formik.values.tableName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.tableName ? formik.errors.tableName : undefined}
                />
              </div>
            </div>
            <div className="flex">
              <div className="grid grid-cols-4 gap-5 mb-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="audit"
                    onCheckedChange={(checked) => formik.setFieldValue('audit', checked)}
                    checked={formik.values.audit}
                  />
                  <Label htmlFor="audit">Audit Model</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enableCrud"
                    onCheckedChange={(checked) => formik.setFieldValue('enableCrud', checked)}
                    checked={formik.values.enableCrud}
                  />
                  <Label htmlFor="Crud">Crud</Label>
                </div>
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-6 rounded-sm">
          <Tabs defaultValue="attributes">
            <TabsList className="grid w-full grid-cols-5">
              {TabList.map(({ label, value }, key) => (
                <TabsTrigger key={key} value={value}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
            {TabList.map(({ value }, key) => (
              <TabsContent key={key} value={value}>
                <Card className="rounded-sm">
                  {value === 'uniqueConstraints' && (
                    <PrimaryKeyTable validation={formik} selectors={selectors} />
                  )}
                  {renderFormList(value)}
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </Card>
      </div>
    </>
  )
}

export default ModelLayout
