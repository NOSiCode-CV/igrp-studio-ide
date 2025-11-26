import { State } from '@igrp/igrp-studio-nextjs-engine/types'
import { nanoid } from '@reduxjs/toolkit'
import {
  IGRPButtonPrimitive,
  IGRPDialogClosePrimitive
} from '@igrp/igrp-framework-react-design-system'
import {
  IGRPDialogPrimitive,
  IGRPDialogContentPrimitive,
  IGRPDialogDescriptionPrimitive,
  IGRPDialogFooterPrimitive,
  IGRPDialogHeaderPrimitive,
  IGRPDialogTitlePrimitive
} from '@igrp/igrp-framework-react-design-system'
import { PATTERNS } from '@renderer/constants/appConstants'
import {
  CheckboxInput,
  SelectInput,
  TextInput
} from '@renderer/generators/api/components/inputs-form'
import { useDroppedComponents } from '@renderer/generators/ui/dnd/DroppedComponentsContext'
import { FormikProps, useFormik } from 'formik'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import * as Yup from 'yup'
import { ImportComponent } from './custom-code-imports'
import useCustomCode from '@renderer/generators/ui/hooks/useCustomCode'
import { getId } from '@renderer/utils'
import { JSX } from 'react/jsx-runtime'

interface StateComponentProps {
  open: boolean
  setOpen: (open: boolean) => void
  state?: State
}

const StateComponent = ({ open, setOpen, state }: StateComponentProps): JSX.Element => {
  const { addState, updateState } = useDroppedComponents()
  const { t } = useTranslation()
  const { typesOptions } = useCustomCode()

  const stateValidationSchema = Yup.object().shape({
    name: Yup.string()
      .required(t('fieldRequired', { name: t('State name') }))
      .matches(PATTERNS.SPECIAL_CHARACTERS, t('msgSpecialCharactersRegex')),
    type: Yup.string().required(t('fieldRequired', { name: t('State type') })),
    defaultValue: Yup.string()
  })

  const formik: FormikProps<State> = useFormik({
    enableReinitialize: true,
    initialValues: state || {
      id: '',
      name: '',
      type: 'string',
      defaultValue: '',
      imports: [],
      isArray: false,
      isOptional: false
    },
    validationSchema: stateValidationSchema,
    onSubmit: (values, actions) => {
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
      } finally {
        actions.setSubmitting(false)
      }
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
    <IGRPDialogPrimitive open={open} onOpenChange={setOpen}>
      <IGRPDialogContentPrimitive className="overflow-hidden sm:max-w-[800px] lg:max-w-[900px] max-w-[90vw] w-full">
        <IGRPDialogHeaderPrimitive>
          <IGRPDialogTitlePrimitive>
            <div className="flex items-center gap-2 justify-between">
              <div>
                {state ? 'Edit State' : 'Create State'}{' '}
                <span className="text-muted-foreground">{state ? state.name : ''}</span>
              </div>
            </div>
          </IGRPDialogTitlePrimitive>
          <IGRPDialogDescriptionPrimitive>
            {state ? 'Edit your state configuration' : 'Define a new state variable'}
          </IGRPDialogDescriptionPrimitive>
        </IGRPDialogHeaderPrimitive>
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

          <IGRPDialogFooterPrimitive className="space-x-2">
            <IGRPDialogClosePrimitive>Close</IGRPDialogClosePrimitive>
            <IGRPButtonPrimitive type="submit" disabled={formik.isSubmitting}>
              {formik.isSubmitting && <Loader2 className="animate-spin" />}
              Save changes
            </IGRPButtonPrimitive>
          </IGRPDialogFooterPrimitive>
        </form>
      </IGRPDialogContentPrimitive>
    </IGRPDialogPrimitive>
  )
}

export { StateComponent }
