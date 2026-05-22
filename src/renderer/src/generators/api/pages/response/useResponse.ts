import type { ResponseConfig } from '@igrp/igrp-studio-springboot-engine/types'
import { useTabs } from '@renderer/components/navigation/TabContext'
import { OPTION_TYPE } from '@renderer/constants/appConstants'
import { useFramework } from '@renderer/hooks/use-framework'
import useStudioAPI from '@renderer/hooks/use-studio-api'
import useToast from '@renderer/hooks/useToast'
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks'
import { getStatusLabel } from '@renderer/utils'
import { useFormik } from 'formik'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import useSchemaTypes from '../../helpers/useSchemaTypes'
import type { JSONSchema } from '../../types/schema'
import { useResponseValidation } from './validation'

const contentType = 'application/json'

const initialValues: ResponseConfig = {
    type: 'response',
    statusCode: '',
    name: '',
    template: 'classic',
    description: '',
    module: '',
    content: {}
}

export const useResponse = ({
    currentItem,
    selectors
}: {
    currentItem: any
    selectors: Array<any>
}) => {
    const dispatch: any = useDispatch()
    const { showErrorToast, showSuccessToast } = useToast()
    const { t } = useTranslation()
    const { initializeTabFromCurrentItem, handleRenameTab } = useTabs()
    const { basePath, dto, enums, getJsonData } = useStudioAPI(currentItem?.module)
    const framework = useFramework()

    const [title, setTitle] = useState('')
    const [dataSchema, setDataSchema] = useState<null | JSONSchema>(null)
    const [data, setData] = useState<any>(null)

    const validationSchema = useResponseValidation({ t })

    const schemaTypes = useSchemaTypes(selectors, dto, enums) // Removed selectors dependency

    const formik = useFormik({
        enableReinitialize: true,
        initialValues,
        validationSchema,
        onSubmit: (_values, actions) => {
            actions.setSubmitting(false)
            handleSave()
        }
    })

    useEffect(() => {
        const load = async () => {
            if (!currentItem) return
            try {
                await getJsonData(currentItem.path).then((data) => setData(data))
            } catch (error) {
                showErrorToast(t('loadError'))
            }
        }
        load()
    }, [currentItem])

    useEffect(() => {
        if (!data) return

        const schema = data.content[contentType]?.schema
        const newDataSchema = schema?.name
            ? { type: '', properties: { [schema.name]: schema } }
            : null

        setDataSchema(newDataSchema)
        setTitle(data.name)
        formik.setValues(data)
    }, [data])

    const handleChangeCode = (value: string) => {
        if (!formik.values.name) {
            formik.setFieldValue('name', getStatusLabel(value))
        }
    }

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault()
                handleSave()
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    const handleSave = async (): Promise<void> => {
        try {
            const values = {
                ...formik.values,
                module: currentItem.module,
                id: currentItem.id
            }

            const { error } = await window.engine.createResponse(values, framework, basePath)

            if (error) return showErrorToast(error)

            dispatch(onSetChangeStatus(true))
            showSuccessToast(t('createdSuccess', { name: t('response'), value: values.name }))
            handleRenameTab(currentItem.id, values.name as string)
        } catch (error) {
            showErrorToast(error)
        }
    }

    const handleDelete = async (): Promise<void> => {
        try {
            const config = {
                name: formik.values.name,
                type: 'response',
                module: currentItem.module
            }

            const { error } = await window.engine.delete(config, framework, basePath)

            if (error) return showErrorToast(error)

            dispatch(onSetChangeStatus(true))
            showSuccessToast(t('deletedSuccess', { name: t('response') }))
        } catch (error) {
            showErrorToast(error)
        }
    }

    const handleSchemaChange = (newSchema: JSONSchema) => {
        const currentSchema = formik.values.content[contentType]
        const properties = newSchema.properties || {}
        const firstKey = Object.keys(properties)[0]
        const extractedSchema = firstKey ? properties[firstKey] : newSchema

        if (
            currentSchema &&
            JSON.stringify(currentSchema.schema) === JSON.stringify(extractedSchema)
        ) {
            return
        }

        formik.setFieldValue('content', {
            ...formik.values.content,
            [contentType]: { schema: extractedSchema }
        })
    }

    const onClickSourceCode = () => {
        initializeTabFromCurrentItem({
            path: `${currentItem.path}`,
            type: OPTION_TYPE.FILE_THREE,
            label: `${currentItem.label}.json`
        })
    }

    return {
        formik,
        title,
        data,
        dataSchema,
        schemaTypes,
        handleSave,
        handleDelete,
        handleChangeCode,
        handleSchemaChange,
        onClickSourceCode
    }
}
