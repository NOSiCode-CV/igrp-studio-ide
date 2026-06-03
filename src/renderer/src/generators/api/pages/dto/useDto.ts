import type { DTOConfig } from '@igrp/igrp-studio-springboot-engine/types'
import { useTabs } from '@renderer/components/navigation/TabContext'
import { ENV_TYPES, OPTION_TYPE } from '@renderer/constants/appConstants'
import { KeyboardKey } from '@renderer/constants/shortcut'
import { useGit } from '@renderer/hooks/use-git'
import useStudioAPI from '@renderer/hooks/use-studio-api'
import { useKeyPress } from '@renderer/hooks/useKeyDown'
import useToast from '@renderer/hooks/useToast'
import { useFormikCompat, useZodForm } from '@renderer/lib/form'
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks'
import { getId } from '@renderer/utils'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import type { IColumnsTabelProps } from '../../types/Interfaces'
import { getTablesColumns, initialValues } from './config'
import { useDtoValidation } from './validation'

export const useDto = ({ selectors, currentItem }: { selectors: Array<any>; currentItem: any }) => {
    const { initializeTabFromCurrentItem, handleRenameTab } = useTabs()
    const { createGitCommit } = useGit()
    const { showErrorToast, showSuccessToast } = useToast()
    const dispatch: any = useDispatch()
    const { models, basePath, dto, enums, getJsonData } = useStudioAPI(currentItem?.module)
    const { t } = useTranslation()

    const [id, setId] = useState<string>('')
    const [data, setData] = useState<any>(null)
    const [tablesColumns, setTableColumns] = useState<{
        [key: string]: IColumnsTabelProps[]
    }>({})

    const validationSchema = useDtoValidation({ t })
    const rhfForm = useZodForm<any>({
        schema: validationSchema as never,
        defaultValues: initialValues
    })
    const formik = useFormikCompat(rhfForm, async (values: any) => {
        await handleSave(values)
    })

    useEffect(() => {
        const load = async () => {
            await getJsonData(currentItem.path).then((data) => {
                setData(data)
            })
        }
        load()
    }, [currentItem])

    useEffect(() => {
        if (!data) {
            formik.resetForm()
            return
        }
        const { attributes, type } = data

        formik.setValues(data)
        formik.setFieldValue('attributes', attributes || initialValues.attributes)
        formik.setFieldValue('attributes', attributes || initialValues.attributes)

        if (type === OPTION_TYPE.MODEL) {
            setId(getId())
            const baseAttributeFields = initialValues.attributes[0]
                ? Object.keys(initialValues.attributes[0])
                : []
            const baseAttributeDefaults = initialValues.attributes[0] || {}

            const mergedAttributes = attributes.map((attr: any) => {
                const mergedAttr = { ...baseAttributeDefaults }
                baseAttributeFields.forEach((field: any) => {
                    if (attr[field] !== undefined) {
                        ;(mergedAttr as any)[field] = attr[field]
                    }
                })
                return mergedAttr
            })

            formik.setFieldValue(
                'attributes',
                mergedAttributes.length ? mergedAttributes : initialValues.attributes
            )
        }
    }, [data])

    useEffect(() => {
        const columns = getTablesColumns({
            selectors,
            dto,
            models,
            enums,
            current: data,
            t
        })
        setTableColumns(columns)
    }, [selectors, dto, models, data])

    // Keyboard shortcut for save (Ctrl/Cmd + S)
    useKeyPress(() => {
        handleSave(formik.values)
    }, [KeyboardKey.save])

    const handleSave = async (newValues: DTOConfig): Promise<void> => {
        try {
            const config = {
                ...newValues,
                module: currentItem?.module || 'shared',
                id: id || currentItem.id
            }

            const { error } = await window.engine.createDto(config, ENV_TYPES.SPRING, basePath)
            console.log('config', config)

            if (error) {
                console.log('error', error)
                showErrorToast(error)
                return
            }

            createGitCommit(basePath, `Add dto ${newValues.name}`)
            dispatch(onSetChangeStatus(true))
            showSuccessToast(t('createdSuccess', { name: t('dto'), value: newValues.name }))
            handleRenameTab(currentItem.id, newValues.name)
        } catch (error) {
            showErrorToast(error)
        }
    }

    const handleDelete = async (): Promise<void> => {
        try {
            const config = {
                name: formik.values.name,
                type: 'dto',
                module: currentItem.module
            }

            const { error } = await window.engine.delete(config, ENV_TYPES.SPRING, basePath)

            if (error) return showErrorToast(error)

            createGitCommit(basePath, `Delete dto ${formik.values.name}`)
            dispatch(onSetChangeStatus(true))
            showSuccessToast(t('deletedSuccess', { name: t('dto') }))
        } catch (error) {
            showErrorToast(error)
        }
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
        tablesColumns,
        data,
        id,
        dto,
        handleSave,
        handleDelete,
        onClickSourceCode
    }
}
