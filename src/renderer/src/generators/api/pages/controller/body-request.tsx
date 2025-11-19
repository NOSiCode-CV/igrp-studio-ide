import React, { useEffect, useState } from 'react'
import { IGRPBadgePrimitive } from '@igrp/igrp-framework-react-design-system'
import { FormList } from '../../../../components/form-list'
import {
  IGRPTabsPrimitive,
  IGRPTabsContentPrimitive,
  IGRPTabsListPrimitive,
  IGRPTabsTriggerPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system'
import { JSONSchemaBuilder } from '../../components/JSONSchema'
import { JSONSchema } from '../../types/schema'
import MonacoEditor from '@renderer/components/monaco-editor'
import { useTranslation } from 'react-i18next'
import { IGRPLabelPrimitive } from '@igrp/igrp-framework-react-design-system'
import { IGRPInputPrimitive } from '@igrp/igrp-framework-react-design-system'

type TbodyType = 'none' | 'multipart/form-data' | 'application/json'

interface BodyRequestProps {
  formik: any
  columnsBody: any
  contentTypes: { label: string; value: string }[]
  schemaTypes?: { label: string; value: string }[]
  collectionTypes: any
}

const routeFormData = 'requestBody'

const defaultValue = {
  type: 'string',
  name: 'fieldName',
  value: '',
  isRequired: true
}

export const BodyRequest: React.FC<BodyRequestProps> = ({
  formik,
  contentTypes,
  schemaTypes,
  columnsBody,
  collectionTypes
}) => {
  const { t } = useTranslation()

  const [bodyType, setBodyType] = useState<TbodyType>('none')

  const [collectionType, setCollectionType] = useState<string>('none')

  const [name, setName] = useState<string>('')

  const [data, setData] = useState<any[]>([])

  const [localSchema, setLocalSchema] = useState<any>(null)

  const requestBodyContent = formik.values.requestBody?.content

  const jsonSchemaToArray = (schema: JSONSchema | null) => {
    return Object.entries(schema?.properties || {}).map(([name, properties]) => {
      return {
        ...properties,
        name
      }
    })
  }

  const updateFormik = (content: any) => {
    const contentType = Object.keys(content)[0]

    const schema = content?.[contentType]?.['schema']

    if (JSON.stringify(requestBodyContent) !== JSON.stringify(content)) {
      formik.setFieldValue(routeFormData, {
        ...formik.values.requestBody,
        content
      })

      setLocalSchema(schema)
    }
  }

  useEffect(() => {
    if (!requestBodyContent) return

    const contentType = Object.keys(requestBodyContent)[0]

    const schema = requestBodyContent?.[contentType]?.['schema']

    if (!localSchema) setLocalSchema(schema)

    setBodyType(contentType as TbodyType)
  }, [requestBodyContent])

  useEffect(() => {
    const data = jsonSchemaToArray(localSchema)
    if (bodyType === 'multipart/form-data') setData(data)
  }, [bodyType])

  const onChangeBody = (element: string, position: number, value: string): void => {
    setData((prev: any) =>
      prev.map((row: any, index: number) =>
        index === position ? { ...row, [element]: value } : row
      )
    )
  }

  const handleSchemaChange = (newSchema: JSONSchema): void => {
    const properties = newSchema.properties || {}
    const firstKey = Object.keys(properties)[0]

    const extractedSchema = firstKey ? properties[firstKey] : newSchema

    const content = {
      [bodyType]: {
        schema: {
          ...extractedSchema,
          collectionType
        }
      }
    }

    updateFormik(content)
  }

  const handleChangeEditor = (value: string): void => {
    const content = {
      [bodyType]: {
        schema: JSON.parse(value)
      }
    }

    updateFormik(content)
  }

  useEffect(() => {
    if (bodyType === 'none') return
    const requestBody = {
      ...formik.values.requestBody,
      name,
      content: {
        [bodyType]: {
          schema: {
            ...formik.values.requestBody?.content[bodyType]?.schema,
            collectionType
          }
        }
      }
    }
    formik.setFieldValue('requestBody', requestBody)
  }, [name, bodyType])

  useEffect(() => {
    if (data.length === 0) return

    const transformedData = {
      type: 'object',
      properties: data.reduce((acc: any, row: any) => {
        const { name, ...rest } = row
        acc[name] = {
          ...rest
        }
        return acc
      }, {})
    }

    const content = {
      ['multipart/form-data']: {
        schema: {
          ...formik.values.requestBody?.content[bodyType]?.schema,
          ...transformedData
        }
      }
    }

    updateFormik(content)
  }, [data])

  const getContentToSchemaProps = (): {
    type: string
    properties: { [key: string]: any }
  } | null => {
    return localSchema
      ? {
          type: 'object',
          properties: {
            [localSchema?.name || 'data']: localSchema
          }
        }
      : null
  }

  const RenderFields = (): React.ReactNode => (
    <>
      <div className="flex flex-col gap-2 w-full">
        <IGRPLabelPrimitive>{t('collectionType')}</IGRPLabelPrimitive>
        <IGRPCombobox
          options={collectionTypes}
          value={collectionType}
          onChange={(selected: string | string[]) => setCollectionType(selected as string)}
          className="w-full h-9"
          placeholder={t('selectCollectionType')}
        />
      </div>
      <div className="flex flex-col gap-2">
        <IGRPLabelPrimitive>{t('name')}</IGRPLabelPrimitive>
        <IGRPInputPrimitive
          name={t('name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
    </>
  )

  return (
    <div className="flex flex-col gap-4 mt-4">
      <div className="flex space-x-4 text-sm">
        <IGRPBadgePrimitive
          onClick={() => setBodyType('none')}
          variant={bodyType === 'none' ? 'default' : 'outline'}
          className="cursor-pointer"
        >
          {t('none')}
        </IGRPBadgePrimitive>
        <IGRPBadgePrimitive
          onClick={() => setBodyType('multipart/form-data')}
          variant={bodyType === 'multipart/form-data' ? 'default' : 'outline'}
          className="cursor-pointer"
        >
          {t('formData')}
        </IGRPBadgePrimitive>
        <IGRPBadgePrimitive
          onClick={() => setBodyType('application/json')}
          variant={
            bodyType === 'multipart/form-data' || bodyType === 'none' ? 'outline' : 'default'
          }
          className="cursor-pointer"
        >
          {t('json')}
        </IGRPBadgePrimitive>
      </div>
      {bodyType === 'none' ? (
        <div className="text-center rounded p-8 border">
          <p className="text-muted-foreground text-xs">{t('noBodyParameters')}</p>
        </div>
      ) : bodyType === 'multipart/form-data' && data && columnsBody ? (
        <>
          <div className="grid grid-cols-3 gap-3">{RenderFields()}</div>
          <div className="border rounded">
            <FormList
              columns={columnsBody}
              data={data}
              formik={formik}
              changeValue={(element, position, value) => {
                onChangeBody(element, position, value)
              }}
              addRow={() => {
                setData((prev) => [...prev, defaultValue])
              }}
              removeRow={(position) => {
                setData((prev) => prev.filter((_row, index) => index !== position))
              }}
              name={routeFormData}
              btnLabels={t('field')}
            />
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <IGRPLabelPrimitive>{t('contentType')}</IGRPLabelPrimitive>
              <IGRPCombobox
                value={bodyType}
                placeholder={t('selectContentType')}
                onChange={(selected: string | string[]) => setBodyType(selected as TbodyType)}
                options={contentTypes}
              />
            </div>
            {RenderFields()}
          </div>
          <IGRPTabsPrimitive defaultValue="schema">
            <IGRPTabsListPrimitive>
              <IGRPTabsTriggerPrimitive value="value">{t('value')}</IGRPTabsTriggerPrimitive>
              <IGRPTabsTriggerPrimitive value="schema">{t('dataSchema')}</IGRPTabsTriggerPrimitive>
            </IGRPTabsListPrimitive>
            <IGRPTabsContentPrimitive value="value">
              <MonacoEditor
                content={JSON.stringify(localSchema, null, 2)}
                filePath=""
                onChange={handleChangeEditor}
                height="20vh"
                language="json"
              />
            </IGRPTabsContentPrimitive>
            <IGRPTabsContentPrimitive value="schema">
              <div className="border rounded">
                <JSONSchemaBuilder
                  schemaTypes={schemaTypes}
                  initialSchema={getContentToSchemaProps()}
                  onSchemaChange={handleSchemaChange}
                />
              </div>
            </IGRPTabsContentPrimitive>
          </IGRPTabsPrimitive>
        </div>
      )}
    </div>
  )
}
