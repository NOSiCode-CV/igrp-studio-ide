import React, { useEffect, useState } from 'react'
import { useFormik } from 'formik'
import { IColumnsTabelProps } from '../Interfaces'
import { getTablesColumns, TabList, initialValues } from './config'

import { useDispatch } from 'react-redux'
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks'
import { useActionValidation } from './validation'
import { useTranslation } from 'react-i18next'
import { ControllerAction, ControllerConfig } from '@igrp/spring-engine/dist/interfaces/types'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@renderer/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@renderer/components/ui/tabs'
import { Combobox } from '@igrp/igrp-design-system'
import { formatMethods } from '../../helpers'
import { TabRequest } from './tab-resquest'

import useToast from '@renderer/components/useToast'
import NavigationBar from '../navigation-bar'
import { CreateEndpointDialog } from './create-endpoint-dialog'
import { TextInput } from '../inputs-form'
import { Label } from '@renderer/components/ui/label'
import { TabResponse } from './tab-response'
import { httpMethods } from '@renderer/constants/appConstants'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@renderer/routes/routeConstants'

interface ControllerProps {
  basePath: string
  defaultModule: string
  selectors: Array<any>
  currentItem: any
  modules: Array<any>
}

const ControllerLayout: React.FC<ControllerProps> = ({
  basePath,
  selectors,
  defaultModule,
  currentItem,
  modules
}: ControllerProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [name, setName] = useState('')
  const [pathController, setPathController] = useState('')
  const [root, setRoot] = useState('')
  const [module, setModule] = useState<string | undefined>(defaultModule)
  const [data, setData] = useState<any>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)

  const dispatch: any = useDispatch()

  const [tablesColumns, setTableColumns] = useState<{ [value: string]: IColumnsTabelProps[] }>({})

  const { showErrorToast, showSuccessToast } = useToast()

  const validationSchema = useActionValidation({ t })

  const formik: any = useFormik({
    enableReinitialize: true,
    initialValues,
    validationSchema,
    onSubmit: (_values, actions) => {
      actions.setSubmitting(false)
      handleSave()
    }
  })

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
    const res = getTablesColumns(selectors)
    setTableColumns(res)
  }, [selectors])

  useEffect(() => {
    if (data) {
      const { name, basePath } = data

      setTitle(`${name}(${basePath})`)
      setName(name)
      setPathController(basePath)
    }
  }, [data])

  useEffect(() => {
    if (currentItem && currentItem.content) {
      const { actionName, path, method, pathVariables, requestParams, headers } =
        currentItem.content

      formik.setFieldValue('actionName', actionName || initialValues.actionName)
      formik.setFieldValue('method', method || initialValues.method)
      formik.setFieldValue('path', path || initialValues.path)
      formik.setFieldValue('pathVariables', pathVariables || initialValues.pathVariables)
      formik.setFieldValue('requestParams', requestParams || initialValues.requestParams)
      formik.setFieldValue('headers', headers || initialValues.headers)
    }
    if (currentItem) setRoot(currentItem.path)
  }, [currentItem])

  const getValuesToSubmit = async () => {
    const values = { ...formik.values }

    delete values.responses

    const data = await window.api.getJsonContent(root)

    const validPathVariables =
      values.pathVariables && values.pathVariables.filter((item) => item.type && item.name)

    // Filter out invalid requestParams
    const validRequestParams =
      values.requestParams && values.requestParams.filter((item) => item.type && item.name)

    const validHeaders = values.headers && values.headers.filter((item) => item.type && item.header)

    const newAction = {
      ...values,
      pathVariables: validPathVariables,
      requestParams: validRequestParams,
      headers: validHeaders
    }

    // Merge or replace actions
    const mergedActions = (data?.actions || []).map((dataAction) => {
      const isMatchingAction = values.actionName === dataAction.actionName

      return isMatchingAction ? newAction : dataAction
    })

    const finalActions: ControllerAction[] = mergedActions.length > 0 ? mergedActions : [newAction]

    const newValues: ControllerConfig = {
      type: 'controller',
      name: name,
      basePath: pathController,
      actions: finalActions,
      module
    }

    return newValues
  }

  const handleSave = async (): Promise<void> => {
    try {
      const values = await getValuesToSubmit()

      const { error } = await window.api.createController(values, basePath)

      console.log(values, error)

      if (error) {
        showErrorToast(error)
        return
      }

      dispatch(onSetChangeStatus(true))

      showSuccessToast(t('createdSuccess', { name: t('controller'), value: values.name }))
    } catch (error: unknown) {
      showErrorToast(error)
    }
  }

  const handleDelete = async (): Promise<void> => {
    try {
      const values = await getValuesToSubmit()

      const { error } = await window.api.deleteController(values, basePath)

      if (error) {
        showErrorToast(error)
        return
      }

      dispatch(onSetChangeStatus(true))
      navigate(ROUTES.PATH_PAGE_BUILDER_API)

      showSuccessToast(t('deletedSuccess', { name: t('controller') }))
    } catch (error) {
      showErrorToast(error)
    }
  }

  const typesData = formatMethods(
    (selectors.find((selector) => 'MYME_TYPES' in selector) as { MYME_TYPES: string[] } | undefined)
      ?.MYME_TYPES || []
  )

  const responseTypes = formatMethods(
    (
      selectors.find((selector) => 'RESPONSE_TYPES' in selector) as
        | { RESPONSE_TYPES: string[] }
        | undefined
    )?.RESPONSE_TYPES || []
  )

  const onSubmit = async () => {
    const errors = await formik.validateForm()
    if (Object.keys(errors).length === 0) {
      // No validation errors, proceed with submit
      if (name) {
        formik.handleSubmit()
      } else {
        setIsModalOpen(true)
      }
    } else {
      // Handle validation errors (optional)
      console.error('Validation errors:', errors)
    }
  }

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
          setName(values.name)
          setPathController(values.basePath)
          setModule(values.module)

          formik.handleSubmit()
        }}
        onClose={() => setIsModalOpen(false)}
        modules={modules}
      />

      <div className="space-y-4 p-4">
        <Card className="rounded">
          <CardHeader>
            <CardTitle>Definition</CardTitle>
            <CardDescription>Provide the name and configuration for this action</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="space-y-3">
                <Label htmlFor={'method'} className="block text-sm font-medium text-gray-700">
                  {'Method Type'}
                </Label>
                <Combobox
                  name={t('method')}
                  placeholder={t('Enter Method')}
                  value={formik.values.method}
                  onChange={(value) => formik.setFieldValue('method', value)}
                  options={httpMethods}
                  className="h-9"
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
            <TabRequest formik={formik} tablesColumns={tablesColumns} />
          </TabsContent>
          <TabsContent value={'response'}>
            <TabResponse formik={formik} responseTypes={responseTypes} contentTypes={typesData} />
          </TabsContent>
        </Tabs>
      </div>
    </React.Fragment>
  )
}

export default ControllerLayout
