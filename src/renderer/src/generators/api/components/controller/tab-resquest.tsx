import React, { useState } from 'react'
import { FormList } from '../form-list'
import { addNewRow, changeValue, removeRow } from '../../helpers'
import { Badge } from '@renderer/components/ui/badge'
interface TabRequestProps {
  formik: any
  tablesColumns: any
}

export const TabRequest: React.FC<TabRequestProps> = ({ formik, tablesColumns }) => {
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body'>('params')
  const [bodyType, setBodyType] = useState<'none' | 'multipart/form-data' | 'json'>('none')

  const tabQueryParams = 'requestParams'
  const tabPathVariables = 'pathVariables'
  const tabHeaders = 'headers'
  const tabBody = 'requestBody'

  const columnsQuery = tablesColumns[tabQueryParams]
  const columnsVariables = tablesColumns[tabPathVariables]
  const columnsHeaders = tablesColumns[tabHeaders]
  const columnsBody = tablesColumns[tabBody]

  const handleBodyTypeChange = (type: 'none' | 'multipart/form-data' | 'json') => {
    setBodyType(type)

    // Clear formik values for body content when type changes
    if (type === 'none') {
      formik.setFieldValue('requestBody', [])
    }
  }

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="flex space-x-4 border-b mb-4 text-sm">
        <button
          onClick={() => setActiveTab('params')}
          className={`px-4 py-2 ${
            activeTab === 'params' ? 'border-b-2 border-igrp text-igrp' : ''
          }`}
        >
          Params
        </button>
        <button
          onClick={() => setActiveTab('body')}
          className={`px-4 py-2 ${activeTab === 'body' ? 'border-b-2 border-igrp text-igrp' : ''}`}
        >
          Body
        </button>
        <button
          onClick={() => setActiveTab('headers')}
          className={`px-4 py-2 ${
            activeTab === 'headers' ? 'border-b-2 border-igrp text-igrp' : ''
          }`}
        >
          Headers
        </button>
      </div>

      {/* Tab Content */}
      <div className={activeTab === 'params' ? 'block' : 'hidden'}>
        {columnsQuery && (
          <div className="space-y-3">
            <p className="text-sm">Query Parameters</p>
            <FormList
              formik={formik}
              columns={columnsQuery}
              data={formik.values[tabQueryParams]}
              changeValue={(element, position, value) =>
                changeValue(formik, element, position, value, tabQueryParams)
              }
              addRow={() => addNewRow(formik, tabQueryParams, tabQueryParams)}
              removeRow={(position) => removeRow(formik, tabQueryParams, position)}
              errors={formik.errors[tabQueryParams]}
              btnLabels={'Query Parameter'}
              name={tabQueryParams}
            />
            <p className="text-sm">Variables</p>
            <FormList
              formik={formik}
              columns={columnsVariables}
              data={formik.values[tabPathVariables]}
              changeValue={(element, position, value) =>
                changeValue(formik, element, position, value, tabPathVariables)
              }
              addRow={() => addNewRow(formik, tabPathVariables, tabPathVariables)}
              removeRow={(position) => removeRow(formik, tabPathVariables, position)}
              errors={formik.errors[tabPathVariables]}
              btnLabels={'Variable'}
              name={tabPathVariables}
            />
          </div>
        )}
      </div>
      <div className={activeTab === 'headers' ? 'block' : 'hidden'}>
        {columnsHeaders && (
          <FormList
            formik={formik}
            columns={columnsHeaders}
            data={formik.values[tabHeaders]}
            changeValue={(element, position, value) =>
              changeValue(formik, element, position, value, tabHeaders)
            }
            addRow={() => addNewRow(formik, tabHeaders, tabHeaders)}
            removeRow={(position) => removeRow(formik, tabQueryParams, position)}
            errors={formik.errors[tabHeaders]}
            btnLabels={tabHeaders}
            name={tabHeaders}
          />
        )}
      </div>
      <div className={activeTab === 'body' ? 'block' : 'hidden'}>
        <div className="mb-4">
          <div className="flex space-x-4 text-sm">
            <Badge
              onClick={() => handleBodyTypeChange('none')}
              variant={bodyType === 'none' ? 'default' : 'outline'}
            >
              None
            </Badge>
            <Badge
              onClick={() => handleBodyTypeChange('multipart/form-data')}
              variant={bodyType === 'multipart/form-data' ? 'default' : 'outline'}
            >
              Form Data
            </Badge>
            <Badge
              onClick={() => handleBodyTypeChange('json')}
              variant={bodyType === 'json' ? 'default' : 'outline'}
            >
              JSON
            </Badge>
          </div>
        </div>

        {bodyType === 'none' && columnsBody && (
          <div className="text-center rounded p-8 border">
            <p className="text-muted-foreground text-xs">This request has no body parameters</p>
          </div>
        )}

        {bodyType === 'multipart/form-data' && columnsBody && (
          <>
            <FormList
              columns={columnsBody}
              data={formik.values[tabBody]['multipart/form-data']['properties'] || []}
              formik={formik}
              changeValue={(element, position, value) =>
                changeValue(formik, element, position, value, tabBody)
              }
              addRow={() => addNewRow(formik, tabBody, 'formData')}
              removeRow={(position) => removeRow(formik, tabBody, position)}
              errors={formik.errors[tabBody]}
              name={'requestBody.multipart/form-data.properties'}
              btnLabels=''
            />
          </>
        )}

        {bodyType === 'json' && (
          <textarea
            value={formik.values['bodyContent']}
            onChange={(e) => formik.setFieldValue('bodyContent', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-igrp focus:border-igrp sm:text-sm"
            rows={6}
            placeholder="Enter JSON body"
          ></textarea>
        )}
      </div>
    </div>
  )
}
