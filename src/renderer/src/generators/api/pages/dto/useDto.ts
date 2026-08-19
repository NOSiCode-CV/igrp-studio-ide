import type { DTOConfig } from '@igrp/igrp-studio-springboot-engine/types'
import { useTabs } from '@renderer/components/navigation/TabContext'
import { ENV_TYPES, OPTION_TYPE } from '@renderer/constants/appConstants'
import { KeyboardKey } from '@renderer/constants/shortcut'
import { useFramework } from '@renderer/hooks/use-framework'
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
import { buildDtoEngineConfig, getInitialValues, getTablesColumns } from './config'
import { useDtoValidation } from './validation'

export const useDto = ({ selectors, currentItem }: { selectors: Array<any>; currentItem: any }) => {
    const { initializeTabFromCurrentItem, handleRenameTab } = useTabs()
    const { createGitCommit } = useGit()
    const { showErrorToast, showSuccessToast } = useToast()
    const framework = useFramework()
    const dispatch: any = useDispatch()
    const { models, basePath, dto, enums, getJsonData } = useStudioAPI(currentItem?.module)
    const { t } = useTranslation()

    const [id, setId] = useState<string>('')
    const [data, setData] = useState<any>(null)
    const [tablesColumns, setTableColumns] = useState<{
        [key: string]: IColumnsTabelProps[]
    }>({})

    const validationSchema = useDtoValidation({ t })
    // Per-framework initial form state: the first attribute's `objectType`
    // namespace differs between Spring (`'java'`) and .NET (`'dotnet'`). The
    // dotnet-engine's JSON-schema rejects `'java'` so seeding the right value
    // up front avoids "objectType must be one of ..." errors on save.
    const rhfForm = useZodForm<any>({
        schema: validationSchema as never,
        defaultValues: getInitialValues(framework)
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
        formik.setFieldValue('attributes', attributes || getInitialValues(framework).attributes)
        formik.setFieldValue('attributes', attributes || getInitialValues(framework).attributes)

        if (type === OPTION_TYPE.MODEL) {
            setId(getId())
            const seedAttributes = getInitialValues(framework).attributes
            const baseAttributeFields = seedAttributes[0] ? Object.keys(seedAttributes[0]) : []
            const baseAttributeDefaults = seedAttributes[0] || {}

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
                mergedAttributes.length ? mergedAttributes : seedAttributes
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
            framework,
            t
        })
        setTableColumns(columns)
    }, [selectors, dto, models, data, framework])

    // Keyboard shortcut for save (Ctrl/Cmd + S)
    useKeyPress(() => {
        handleSave(formik.values)
    }, [KeyboardKey.save])

    const handleSave = async (newValues: DTOConfig): Promise<void> => {
        try {
            const config = buildDtoEngineConfig(
                newValues,
                framework,
                currentItem?.module || 'shared',
                id || currentItem.id
            )

            // `extends` (Java/Spring class inheritance) and `readOnly` are
            // Spring-only fields on DTOConfig. The dotnet-engine schema is
            // strict (`additionalProperties: false`) and rejects them with
            // "No additional properties are allowed in the model
            // configuration schema". Strip them before sending so the same
            // form works for both engines without diverging the form state.
            if (framework !== ENV_TYPES.SPRING) {
                delete config.extends
                delete config.readOnly
            }

            const { error } = await window.engine.createDto(config, framework, basePath)
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

            const { error } = await window.engine.delete(config, framework, basePath)

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
