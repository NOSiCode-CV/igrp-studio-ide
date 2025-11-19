import { useEffect, useState } from 'react'
import { useFormik } from 'formik'
import { useDispatch } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useGit } from '@renderer/hooks/use-git'
import { useTabs } from '@renderer/components/navigation/TabContext'
import useStudioAPI from '@renderer/hooks/use-studio-api'
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks'
import { ControllerAction, ControllerConfig } from '@igrp/igrp-studio-springboot-engine/types'
import { ENV_TYPES, OPTION_TYPE } from '@renderer/constants/appConstants'
import { SchemaTypeItem } from 'src/main/types'
import { IColumnsTabelProps } from '../../types/Interfaces'
import { getTablesColumns, initialValues } from './config'
import { useActionValidation } from './validation'
import { formatMethods } from '../../helpers'
import useSchemaTypes from '../../helpers/useSchemaTypes'
import useToast from '@renderer/hooks/useToast'
import { useKeyPress } from '@renderer/hooks/useKeyDown'
import { KeyboardKey } from '@renderer/constants/shortcut'

export const useController = ({
  selectors,
  currentItem
}: {
  selectors: Array<any>
  currentItem: any
}) => {
  const { t } = useTranslation()
  const { createGitCommit } = useGit()
  const { initializeTabFromCurrentItem, handleRenameTab } = useTabs()
  const { modules, dto, basePath, enums, responses, getJsonData } = useStudioAPI(
    currentItem?.module
  )
  const { showErrorToast, showSuccessToast } = useToast()
  const dispatch: any = useDispatch()

  const [id, setId] = useState('')
  const [oldActionName, setOldActionName] = useState('')
  const [title, setTitle] = useState('')
  const [controller, setController] = useState<{
    name: string
    description: string
    path: string
    module: string
  }>({
    name: '',
    description: '',
    path: '',
    module: currentItem?.module
  })
  const [data, setData] = useState<any>(null)
  const [enumTypes, setEnumTypes] = useState<SchemaTypeItem[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tablesColumns, setTableColumns] = useState<{
    [value: string]: IColumnsTabelProps[]
  }>({})

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

  const loadAction = (content: ControllerAction) => {
    const {
      actionName,
      path,
      method,
      pathVariables,
      requestParams,
      headers,
      responses,
      requestBody,
      permission,
      roles
    } = content
    formik.setFieldValue('actionName', actionName || initialValues.actionName)
    formik.setFieldValue('method', method || initialValues.method)
    formik.setFieldValue('path', path || initialValues.path)
    formik.setFieldValue('requestBody', requestBody || initialValues.requestBody)
    formik.setFieldValue('pathVariables', pathVariables || initialValues.pathVariables)
    formik.setFieldValue('requestParams', requestParams || initialValues.requestParams)
    formik.setFieldValue('responses', responses || initialValues.responses)
    formik.setFieldValue('headers', headers || initialValues.headers)
    formik.setFieldValue('permission', permission || initialValues.permission)
    formik.setFieldValue('roles', roles || initialValues.roles)
    setOldActionName(actionName)
  }

  useEffect(() => {
    const res = getTablesColumns(selectors, enumTypes, t)
    setTableColumns(res)
  }, [selectors, enumTypes])

  useEffect(() => {
    if (!data) return
    const { name, basePath, description, module } = data
    setTitle(`${name}(${basePath})`)
    setController({ name, description, path: basePath, module })
  }, [data])

  useEffect(() => {
    const { content, id } = currentItem

    setId(id)
    loadAction(content || {})

    const load = async () => {
      await getJsonData(currentItem.path).then(setData)
    }
    load()
  }, [currentItem])

  const getValuesToSubmit = async () => {
    const values = { ...formik.values }
    const data = await getJsonData(currentItem?.path)
    const actionName = oldActionName || values.actionName

    const validPathVariables = values.pathVariables?.filter((item: any) => item.type && item.name)
    const validRequestParams = values.requestParams?.filter((item: any) => item.type && item.name)
    const validHeaders = values.headers?.filter((item: any) => item.type && item.header)

    const newAction = {
      ...values,
      pathVariables: validPathVariables,
      requestParams: validRequestParams,
      headers: validHeaders,
      permission: values.permission,
      roles: values.roles
    }

    const existingActions = data?.actions || []
    const isActionExisting = existingActions.some(
      (dataAction: any) => dataAction.actionName === oldActionName
    )

    const mergedActions = existingActions.map((dataAction: any) =>
      dataAction.actionName === actionName ? newAction : dataAction
    )

    const finalActions: ControllerAction[] = isActionExisting
      ? mergedActions
      : [...existingActions, newAction]

    const { name, description, path, module } = controller

    return {
      type: 'controller',
      name,
      module,
      description,
      basePath: path,
      actions: finalActions,
      id
    } as ControllerConfig
  }

  // Keyboard shortcut for save (Ctrl/Cmd + S)
  useKeyPress(() => {
    formik.handleSubmit()
  }, [KeyboardKey.save])

  const handleSave = async (): Promise<void> => {
    try {
      if (!controller.name || !controller.module || !controller.description) {
        setIsModalOpen(true)
        return
      }

      const values = await getValuesToSubmit()

      const { error } = await window.engine.createController(values, ENV_TYPES.SPRING, basePath)

      console.log(values, error)

      if (error) {
        showErrorToast(error)
        return
      }

      setOldActionName(formik.values.actionName)

      createGitCommit(basePath, `Add action ${formik.values.actionName}`)
      dispatch(onSetChangeStatus(true))
      showSuccessToast(
        t('createdSuccess', {
          name: t('controller'),
          value: values.name
        })
      )

      handleRenameTab(id, formik.values.actionName)
    } catch (error) {
      showErrorToast(error)
    }
  }

  const handleDelete = async (): Promise<void> => {
    try {
      const values = await getValuesToSubmit()
      const countActions = values.actions.length

      if (countActions === 1) {
        const config = {
          name,
          type: 'controller',
          module: currentItem.module
        }
        const { error } = await window.engine.delete(config, ENV_TYPES.SPRING, basePath)
        if (error) return showErrorToast(error)
      } else {
        const updatedActions = values.actions.filter(
          (dataAction: any) => dataAction.actionName !== formik.values.actionName
        )
        const updatedValues = { ...values, actions: updatedActions }
        const { error } = await window.engine.createController(
          updatedValues,
          ENV_TYPES.SPRING,
          basePath
        )
        if (error) return showErrorToast(error)
      }

      createGitCommit(basePath, `Delete action ${formik.values.name}`)
      dispatch(onSetChangeStatus(true))
      showSuccessToast(t('deletedSuccess', { name: t('controller') }))
    } catch (error) {
      showErrorToast(error)
    }
  }

  const typesData = formatMethods(
    (
      selectors.find((selector: any) => 'MYME_TYPES' in selector) as
        | { MYME_TYPES: string[] }
        | undefined
    )?.MYME_TYPES || []
  )

  const collectionType = formatMethods(
    (
      selectors.find((selector) => 'COLLECTION_TYPES' in selector) as
        | { COLLECTION_TYPES: string[] }
        | undefined
    )?.COLLECTION_TYPES || []
  )

  useEffect(() => {
    setEnumTypes(
      enums.map((enumItem: any) => ({
        label: enumItem.name,
        value: enumItem.name
      }))
    )
  }, [enums])

  const schemaTypes = useSchemaTypes(selectors, dto, enums)

  const onClickSourceCode = () => {
    initializeTabFromCurrentItem({
      path: `${currentItem.path}`,
      type: OPTION_TYPE.FILE_THREE,
      label: `${currentItem.label}.json`
    })
  }

  return {
    basePath,
    formik,
    title,
    controller,
    setController,
    isModalOpen,
    setIsModalOpen,
    tablesColumns,
    typesData,
    collectionType,
    schemaTypes,
    enumTypes,
    responses,
    modules,
    handleSave,
    handleDelete,
    onClickSourceCode
  }
}
