import {
  IGRPCardContentPrimitive,
  IGRPCardPrimitive
} from '@igrp/igrp-framework-react-design-system'
import NavigationBar from '../../components/navigation-bar'
import { TextInput } from '../../components/inputs-form'
import { FormList } from '../../../../components/form-list'
import { useEnum } from './useEnum'
import { addNewRow, changeValue, removeRow } from '../../helpers'
import { defaultValue } from './config'
import { useTranslation } from 'react-i18next'

interface EnumProps {
  selectors: Array<any>
  currentItem: any
  onCloseTab: () => void
}

export const EnumLayout = ({ currentItem, onCloseTab }: EnumProps) => {
  const { formik, title, data, tablesColumns, handleDelete, onClickSourceCode } = useEnum({
    currentItem
  })

  const { t } = useTranslation()

  const tableName = 'values'

  return (
    <form onSubmit={formik.handleSubmit}>
      <NavigationBar
        onDelete={() => {
          handleDelete()
          onCloseTab()
        }}
        isNew={!data}
        title={title || t('createNewEnum')}
        showSourceCode={onClickSourceCode}
      />
      <div className="space-y-4 p-4">
        <IGRPCardPrimitive>
          <IGRPCardContentPrimitive>
            <div className="flex flex-col gap-4">
              <TextInput
                id="name"
                label={t('name')}
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.errors.name}
                isTouched={formik.touched.name}
                isRequired
              />
              <div className="border rounded-lg pb-2">
                <FormList
                  columns={tablesColumns.values || []}
                  formik={formik}
                  data={formik.values.values}
                  changeValue={(element, position, result) =>
                    changeValue(formik, element, position, result, tableName)
                  }
                  addRow={() => addNewRow(formik, tableName, defaultValue)}
                  removeRow={(position) => removeRow(formik, tableName, position)}
                  btnLabels={t('enum')}
                  name={tableName}
                />
              </div>
            </div>
          </IGRPCardContentPrimitive>
        </IGRPCardPrimitive>
      </div>
    </form>
  )
}
