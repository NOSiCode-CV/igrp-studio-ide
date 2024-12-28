import React, { useState } from 'react'
import AddResponseModal from './add-response-modal'
import { Label } from '@renderer/components/ui/label'
import { Combobox } from '@igrp/igrp-design-system'
import { useTranslation } from 'react-i18next'
import { Input } from '@renderer/components/ui/input'
import { httpStatusCodes } from '@renderer/constants/appConstants'

interface TabResponseProps {
  formik: any
  responseTypes: any
}

export const TabResponse: React.FC<TabResponseProps> = ({ formik, responseTypes }) => {
  const { t } = useTranslation()

  const [activeResponseTab, setActiveResponseTab] = useState<string>('200')
  const [responses, setResponses] = useState(formik.values.responses)

  const handleAddResponse = (response: {
    name: string
    statusCode: string
    contentType: string
  }) => {
    const { name, statusCode, contentType } = response

    const updatedResponses = {
      ...formik.values.responses,
      [statusCode]: {
        description: name,
        content: {
          [contentType]: {} // Dynamic content type key
        }
      }
    }

    formik.setFieldValue('responses', updatedResponses)

    setActiveResponseTab(statusCode)
    setResponses((prevResponses) => ({
      ...prevResponses,
      [statusCode]: updatedResponses[statusCode]
    }))
  }

  return (
    <div className="w-full">
      {/* Response Tabs Navigation */}
      <div className="flex justify-between border-b mb-4 text-sm">
        <div className="flex space-x-4">
          {Object.keys(responses).map((statusCode) => (
            <button
              key={statusCode}
              onClick={() => setActiveResponseTab(statusCode)}
              className={`px-4 py-2 ${
                activeResponseTab === statusCode ? 'border-b-2 border-igrp text-igrp' : ''
              }`}
            >
              {`${responses[statusCode].description} (${statusCode})`}
            </button>
          ))}
        </div>
        <AddResponseModal onSave={handleAddResponse} responseTypes={responseTypes} />
      </div>

      {/* Response Tab Content */}
      <div>
        {Object.keys(responses).map((statusCode) => {
          const description = responses[statusCode].description
          const content = responses[statusCode].content
          const contentType = Object.keys(content)[0]

          return (
            <div key={statusCode} className={activeResponseTab === statusCode ? 'block' : 'hidden'}>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={'statusCode'} className="">
                    {'HTTP Status Code'}
                  </Label>
                  <Combobox
                    options={httpStatusCodes}
                    name="statusCode"
                    value={statusCode}
                    onChange={(value) => formik.setFieldValue('contentType', value)}
                    className="w-full focus:ring-igrp focus:border-igrp"
                    placeholder="e.g., 200, 400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={'name'} className="">
                    {'Name'}
                  </Label>
                  <Input
                    name={t('name')}
                    value={description}
                    placeholder=""
                    onChange={(value) => formik.setFieldValue('name', value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={'contentType'} className="">
                    {'Content Type'}
                  </Label>
                  <Combobox
                    name={t('contentType')}
                    value={contentType}
                    placeholder="Select Content Type"
                    onChange={(value) => formik.setFieldValue('contentType', value)}
                    options={responseTypes}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
