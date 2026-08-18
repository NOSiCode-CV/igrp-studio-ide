import type { ModelConfig, RelationReference } from '@igrp/igrp-studio-springboot-engine/types'
import { useTabs } from '@renderer/components/navigation/TabContext'
import { OPTION_TYPE } from '@renderer/constants/appConstants'
import { KeyboardKey } from '@renderer/constants/shortcut'
import { useFramework } from '@renderer/hooks/use-framework'
import { useGit } from '@renderer/hooks/use-git'
import useStudioAPI from '@renderer/hooks/use-studio-api'
import { useKeyPress } from '@renderer/hooks/useKeyDown'
import useToast from '@renderer/hooks/useToast'
import { useFormikCompat, useZodForm } from '@renderer/lib/form'
import { setChangeStatus as onSetChangeStatus } from '@renderer/redux/thunks'
import { type FocusEvent, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import type { IColumnsTabelProps } from '../../types/Interfaces'
import { defaultValues, getInitialValues, getTablesColumns, getValuesToSubmit } from './config'
import { useModelValidation } from './validation'

export const useModel = ({
    selectors,
    currentItem
}: {
    selectors: Array<any>
    currentItem: any
}) => {
    const { createGitCommit } = useGit()
    const { initializeTabFromCurrentItem, handleRenameTab } = useTabs()
    const { showErrorToast, showSuccessToast } = useToast()
    const { models, basePath, config, enums, findModelsByName, getJsonData } = useStudioAPI(
        currentItem?.module
    )
    const { t } = useTranslation()
    const validationSchema = useModelValidation({ t })
    const framework = useFramework()
    const dispatch: any = useDispatch()

    const [tablesColumns, setTableColumns] = useState<{
        [value: string]: IColumnsTabelProps[]
    }>({})
    const [data, setData] = useState<any>(null)
    const [enableEntityRevision, setEnableEntityRevision] = useState(false)

    // Per-framework defaults: the primary-key `generationType` differs
    // between Spring (`'IDENTITY'`) and .NET (`'Identity'`). Computed each
    // render so the form re-seeds if the active project's framework
    // changes (e.g. user opens a different project without remounting).
    const rhfForm = useZodForm<any>({
        schema: validationSchema as never,
        defaultValues: getInitialValues(framework)
    })
    const formik: any = useFormikCompat(rhfForm, async () => {
        await handleSave()
    })

    const suggestTableName = async (name: string) => {
        const errors = await formik.validateForm()
        if (errors.name) return ''

        const nameProcessed = name
            .replace(/([a-z])([A-Z])/g, '$1_$2')
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '_')

        return nameProcessed.startsWith('t_') ? nameProcessed : `t_${nameProcessed}`
    }

    const handleNameBlur = async (e: FocusEvent<HTMLInputElement>): Promise<void> => {
        formik.handleBlur(e)
        const name = e.target.value

        if (formik.values.tableName) return
        const value = await suggestTableName(name)
        formik.setFieldValue('tableName', value)
    }

    useEffect(() => {
        const appConfig = config.config as { enableEntityRevision?: boolean }
        setEnableEntityRevision(appConfig.enableEntityRevision || false)
    }, [config])

    useEffect(() => {
        const { attributes, revision } = formik.values
        const res = getTablesColumns({
            selectors,
            attributes,
            revision,
            models,
            currentItem,
            enums,
            framework,
            t
        })
        setTableColumns(res)
    }, [selectors, formik.values, models])

    useEffect(() => {
        const load = async () => {
            await getJsonData(currentItem.path).then(setData)
        }
        load()
    }, [currentItem])

    useEffect(() => {
        if (!data) {
            formik.resetForm()
            return
        }

        const {
            revision,
            audit,
            name,
            tableName,
            attributes,
            crud,
            primaryKey,
            uniqueConstraints,
            indexes
        } = data

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
            uniqueConstraints?.length > 0 ? uniqueConstraints : [defaultValues.uniqueConstraints]
        const indexesTable = indexes?.length > 0 ? indexes : [defaultValues.indexes]

        formik.setFieldValue('revision', revision || false)
        // `audit` was previously omitted here: reopening an existing schema
        // left the form on its brand-new-model default (`audit: true` from
        // `getInitialValues`) instead of the persisted value, so saving any
        // unrelated edit (e.g. toggling Revision) silently flipped a
        // persisted `audit: false` model back to `audit: true`.
        formik.setFieldValue('audit', audit || false)
        formik.setFieldValue('name', name || '')
        formik.setFieldValue('tableName', tableName || '')
        formik.setFieldValue('crud', crud || false)
        formik.setFieldValue('attributes', mergedAttributes || [defaultValues.attributes])
        formik.setFieldValue('uniqueConstraints', constraints)
        formik.setFieldValue('indexes', indexesTable)
    }, [data])

    const handleSave = async (): Promise<void> => {
        try {
            const currentData = await getJsonData(currentItem.path)
            const values = getValuesToSubmit(
                { ...currentData, ...formik.values, id: currentItem.id },
                currentItem?.module || 'shared'
            )
            console.log(values)
            const { error } = await window.engine.createModel(values, framework, basePath)

            if (error) {
                console.log('error', error)
                showErrorToast(error)
                return
            }

            // A newly-created schema has no metadata file yet, so getJsonData
            // returns null. Relation cleanup is still valid for that first save
            // (there are no previous relations), but must receive an empty
            // model-shaped value instead of dereferencing null.
            await removeStaleRelationReferences(
                currentData ?? ({ attributes: [] } as unknown as ModelConfig),
                values
            )
            await createRelationReference(values)
            dispatch(onSetChangeStatus(true))
            showSuccessToast(t('createdSuccess', { name: t('model'), value: values.name }))
            handleRenameTab(currentItem.id, values.name)
        } catch (error) {
            showErrorToast(error)
        }
    }

    // Keyboard shortcut for save (Ctrl/Cmd + S)
    useKeyPress(() => {
        handleSave()
    }, [KeyboardKey.save])

    const removeStaleRelationReferences = async (
        previousValues: ModelConfig,
        values: ModelConfig
    ) => {
        const previousRelations = (previousValues.attributes ?? []).filter(
            (attribute: any) =>
                attribute.type === 'relation' &&
                attribute.relation?.cardinality === 'twoWay' &&
                attribute.relation?.mappedBy
        )

        for (const attribute of previousRelations) {
            const relation = attribute.relation as {
                entity: string
                mappedBy: string
            }
            const stillExists = (values.attributes ?? []).some(
                (currentAttribute: any) =>
                    currentAttribute.type === 'relation' &&
                    currentAttribute.name === attribute.name &&
                    currentAttribute.relation?.entity === relation.entity &&
                    currentAttribute.relation?.mappedBy === relation.mappedBy
            )

            if (stillExists) continue

            const schemaRef = findModelsByName(relation.entity)
            if (!schemaRef) continue

            try {
                const modelData = await window.api.getJsonContent(schemaRef.path || '')
                const existingRefs = Array.isArray(modelData.relationReference)
                    ? modelData.relationReference
                    : []
                const updatedReferences = existingRefs.filter(
                    (existingRef: any) =>
                        !(
                            existingRef.entity === previousValues.name &&
                            existingRef.fieldName === relation.mappedBy &&
                            existingRef.mappedBy === attribute.name
                        )
                )

                if (updatedReferences.length === existingRefs.length) continue

                const { error } = await window.engine.createModel(
                    { ...modelData, relationReference: updatedReferences },
                    framework,
                    basePath
                )

                if (error) showErrorToast(error)
            } catch (error) {
                console.error('Failed to remove stale relation reference:', error)
            }
        }

        // A relation can already have been removed in an earlier save. Sweep
        // the module's generated inverse references as well so a stale
        // reference cannot survive in the project metadata and be regenerated
        // as a phantom navigation.
        for (const schema of models) {
            const schemaPath = (schema as any).path
            if (!schemaPath) continue

            try {
                const modelData = await window.api.getJsonContent(schemaPath)
                const existingRefs = Array.isArray(modelData.relationReference)
                    ? modelData.relationReference
                    : []
                const updatedReferences = existingRefs.filter((existingRef: any) => {
                    if (existingRef.entity !== values.name) return true

                    return (values.attributes ?? []).some(
                        (attribute: any) =>
                            attribute.type === 'relation' &&
                            attribute.name === existingRef.mappedBy &&
                            attribute.relation?.entity === modelData.name &&
                            attribute.relation?.mappedBy === existingRef.fieldName
                    )
                })

                if (updatedReferences.length === existingRefs.length) continue

                const { error } = await window.engine.createModel(
                    { ...modelData, relationReference: updatedReferences },
                    framework,
                    basePath
                )

                if (error) showErrorToast(error)
            } catch (error) {
                console.error('Failed to sweep stale relation references:', error)
            }
        }
    }

    const createRelationReference = async (values: ModelConfig) => {
        const { attributes, name: entityFrom } = values

        // Each createModel call regenerates shared project artefacts. Running
        // relation-reference updates concurrently lets those writes race on
        // the same temporary/output files (especially on synced folders).
        // Keep the updates ordered so one generated project is written at a
        // time.
        for (const attribute of attributes) {
                const { relation, type, name } = attribute
                if (type !== 'relation' || !relation) continue

                const { mappedBy, fetchType, type: relationType, entity, cardinality } = relation
                // A relation reference is only needed when the target model
                // owns the inverse navigation. An owning-side relation with
                // no mappedBy has no inverse field to synthesize.
                if (cardinality !== 'twoWay' || !mappedBy) continue

                // A generated relation reference represents the inverse side of
                // the relation declared on the current model.  In particular,
                // a ManyToOne owner must expose a OneToMany collection on the
                // target model (and vice versa).  Reusing relationType here
                // makes the target navigation scalar and produces the wrong
                // EF relationship shape.
                const inverseRelationType =
                    relationType === 'OneToMany'
                        ? 'ManyToOne'
                        : relationType === 'ManyToOne'
                          ? 'OneToMany'
                          : relationType

                const relationReference: RelationReference = {
                    type: inverseRelationType,
                    entity: entityFrom,
                    fetchType,
                    fieldName: mappedBy,
                    mappedBy: name,
                    module: currentItem?.module
                }

                const schemaRef = findModelsByName(entity)
                if (!schemaRef) continue

                try {
                    const modelData = await window.api.getJsonContent(schemaRef?.path || '')
                    const existingRefs = Array.isArray(modelData.relationReference)
                        ? modelData.relationReference
                        : []

                    const existingIndex = existingRefs.findIndex(
                        (existingRef: any) =>
                            existingRef.fieldName === relationReference.fieldName &&
                            existingRef.mappedBy === relationReference.mappedBy
                    )

                    // When both sides are explicitly modeled, the target's
                    // relation attribute already emits the navigation and EF
                    // mapping. Keeping a generated relationReference as well
                    // would emit the same FK property/navigation twice. Drop
                    // a stale reference if one exists, but do not add a new
                    // duplicate reference.
                    const targetHasExplicitRelation = (modelData.attributes ?? []).some(
                        (targetAttribute: any) =>
                            targetAttribute.type === 'relation' &&
                            targetAttribute.name === relationReference.fieldName &&
                            targetAttribute.relation?.entity === entityFrom
                    )

                    if (targetHasExplicitRelation) {
                        if (existingIndex < 0) continue

                        const updatedModel = {
                            ...modelData,
                            relationReference: existingRefs.filter(
                                (_: any, index: number) => index !== existingIndex
                            )
                        }

                        const { error } = await window.engine.createModel(
                            updatedModel,
                            framework,
                            basePath
                        )

                        if (error) showErrorToast(error)
                        continue
                    }

                    let updatedReferences
                    if (existingIndex >= 0) {
                        updatedReferences = [...existingRefs]
                        updatedReferences[existingIndex] = {
                            ...updatedReferences[existingIndex],
                            ...relationReference
                        }
                    } else {
                        updatedReferences = [...existingRefs, relationReference]
                    }

                    const updatedModel = {
                        ...modelData,
                        relationReference: updatedReferences
                    }

                    const { error } = await window.engine.createModel(
                        updatedModel,
                        framework,
                        basePath
                    )

                    if (error) showErrorToast(error)
                } catch (error) {
                    console.error('Failed to fetch JSON content:', error)
                }
        }
    }

    const deleteModel = async (): Promise<void> => {
        try {
            const config = {
                name: formik.values.name,
                type: 'model',
                module: currentItem.module
            }

            const { error } = await window.engine.delete(config, framework, basePath)
            if (error) return showErrorToast(error)

            dispatch(onSetChangeStatus(true))
            createGitCommit(basePath, `Delete schema ${formik.values.name}`)
            showSuccessToast(t('deletedSuccess', { name: t('model') }))
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
        enableEntityRevision,
        handleSave,
        deleteModel,
        onClickSourceCode,
        handleNameBlur
    }
}
