import { Button } from '@renderer/components/ui/button'
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@renderer/components/ui/dialog'
import type { State } from '@igrp/igrp-studio-nextjs-engine/types'
import { nanoid } from '@reduxjs/toolkit'
import { PATTERNS } from '@renderer/constants/appConstants'
import {
    CheckboxInput,
    SelectInput,
    TextInput
} from '@renderer/generators/api/components/inputs-form'
import { useDroppedComponents } from '@renderer/generators/ui/contexts/EditorContext'
import useCustomCode from '@renderer/generators/ui/hooks/useCustomCode'
import { getId } from '@renderer/utils'
import { useFormikCompat, useZodForm } from '@renderer/lib/form'
import { Loader2 } from 'lucide-react'
import { useMemo } from 'react'
import type { JSX } from 'react/jsx-runtime'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { ImportComponent } from './custom-code-imports'

interface StateComponentProps {
    open: boolean
    setOpen: (open: boolean) => void
    state?: State
}

const StateComponent = ({ open, setOpen, state }: StateComponentProps): JSX.Element => {
    const { addState, updateState } = useDroppedComponents()
    const { t } = useTranslation()
    const { typesOptions } = useCustomCode()

    const stateValidationSchema = useMemo(
        () =>
            z
                .object({
                    name: z
                        .string()
                        .min(1, t('fieldRequired', { name: t('State name') }))
                        .regex(PATTERNS.SPECIAL_CHARACTERS, t('msgSpecialCharactersRegex')),
                    type: z.string().min(1, t('fieldRequired', { name: t('State type') })),
                    defaultValue: z.string().optional()
                })
                .passthrough(),
        [t]
    )

    const rhfForm = useZodForm<State>({
        schema: stateValidationSchema as never,
        defaultValues: (state || {
            id: '',
            name: '',
            type: 'string',
            defaultValue: '',
            imports: [],
            isArray: false,
            isOptional: false
        }) as State
    })
    const formik = useFormikCompat<State>(rhfForm, (values) => {
        try {
            const stateData = {
                ...values,
                defaultValue: values.defaultValue?.toString()
            }

            if (stateData.id === '') {
                addState({
                    ...stateData,
                    id: `state_${nanoid(6).replace(/-/g, '')}`
                })
            } else {
                updateState(stateData.id, stateData)
            }

            setOpen(false)
        } catch (error) {
            console.error('Submission failed:', error)
        }
    })

    const handleTypeChange = (value: string): void => {
        formik.setFieldValue('type', value)
        const selectedType = typesOptions.find((type) => type.value === value)
        if (selectedType && selectedType.metadata) {
            const namespace = `import {${selectedType.metadata.name}} from '${selectedType.metadata?.path}'`
            formik.setFieldValue('imports', [
                ...(formik.values.imports || []),
                {
                    namespace,
                    id: getId()
                }
            ])
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="overflow-hidden sm:max-w-[800px] lg:max-w-[900px] max-w-[90vw] w-full">
                <DialogHeader>
                    <DialogTitle>
                        <div className="flex items-center gap-2 justify-between">
                            <div>
                                {state ? 'Edit State' : 'Create State'}{' '}
                                <span className="text-muted-foreground">
                                    {state ? state.name : ''}
                                </span>
                            </div>
                        </div>
                    </DialogTitle>
                    <DialogDescription>
                        {state ? 'Edit your state configuration' : 'Define a new state variable'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={formik.handleSubmit} className="space-y-4">
                    <TextInput
                        label={t('Name')}
                        id="name"
                        placeholder="myState"
                        value={formik.values.name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        isTouched={formik.touched.name}
                        error={formik.errors.name}
                        isRequired
                    />

                    <SelectInput
                        label={t('Type')}
                        id="type"
                        value={formik.values.type}
                        onChange={(value) => handleTypeChange(value as string)}
                        options={typesOptions}
                    />

                    <TextInput
                        label={t('defaultValue')}
                        id="defaultValue"
                        placeholder="defaultValue"
                        value={formik.values.defaultValue}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        isTouched={formik.touched.defaultValue}
                        error={formik.errors.defaultValue}
                        isRequired
                    />

                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center space-x-2">
                            <CheckboxInput
                                label={t('isArray')}
                                id="isArray"
                                value={formik.values.isArray}
                                onChange={(value) => formik.setFieldValue('isArray', value)}
                                isTouched={formik.touched.isArray}
                                error={formik.errors.isArray}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <CheckboxInput
                                id={`isOptional`}
                                value={formik.values.isOptional}
                                onChange={(value) => formik.setFieldValue('isOptional', value)}
                                label="isOptional"
                            />
                        </div>
                    </div>

                    <ImportComponent
                        initialImports={formik.values?.imports || []}
                        onChange={(imports) => formik.setFieldValue('imports', imports)}
                    />

                    <DialogFooter className="space-x-2">
                        <DialogClose>Close</DialogClose>
                        <Button type="submit" disabled={formik.isSubmitting}>
                            {formik.isSubmitting && <Loader2 className="animate-spin" />}
                            Save changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export { StateComponent }
