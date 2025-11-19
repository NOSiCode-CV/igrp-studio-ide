import { useState, useEffect } from 'react'
import { Variable, Plus, Trash2, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SectionProps, CustomProperty } from '../types'

export function CustomPropertiesSection({ onChangeStyles, styles }: SectionProps) {
  const [properties, setProperties] = useState<CustomProperty[]>(
    styles.customProperties?.properties || []
  )

  const addProperty = () => {
    const newProperties = [...properties, { name: '', value: '' }]
    setProperties(newProperties)
    onChangeStyles({ customProperties: { properties: newProperties } })
  }

  const removeProperty = (index: number) => {
    const newProperties = properties.filter((_, i) => i !== index)
    setProperties(newProperties)
    onChangeStyles({ customProperties: { properties: newProperties } })
  }

  const updateProperty = (index: number, field: keyof CustomProperty, value: string) => {
    const newProperties = [...properties]
    newProperties[index] = { ...newProperties[index], [field]: value }
    setProperties(newProperties)
    onChangeStyles({ customProperties: { properties: newProperties } })
  }

  const resetProperties = () => {
    setProperties([])
  }

  // Update local state when styles change externally
  useEffect(() => {
    setProperties(styles.customProperties?.properties || [])
  }, [styles.customProperties])

  const { t } = useTranslation()
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
          <Variable size={10} />
          {t('customProperties')}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={resetProperties}
            className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Reset properties"
          >
            <RefreshCw size={10} />
          </button>
          <button
            onClick={addProperty}
            className="flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
          >
            <Plus size={10} />
            {t('add')}
          </button>
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="py-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">No custom properties added</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Click "Add" to create one</p>
        </div>
      ) : (
        <div className="space-y-1">
          {properties.map((property, index) => (
            <div
              key={index}
              className="flex items-center gap-1 bg-white dark:bg-gray-800/50 rounded-md p-1"
            >
              <input
                type="text"
                value={property.name}
                onChange={(e) => updateProperty(index, 'name', e.target.value)}
                placeholder="name"
                spellCheck="false"
                className="w-[72px] px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
              />
              <input
                type="text"
                value={property.value}
                onChange={(e) => updateProperty(index, 'value', e.target.value)}
                placeholder="value"
                spellCheck="false"
                className="flex-1 min-w-0 px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
              />
              <button
                onClick={() => removeProperty(index)}
                className="flex-none p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Remove property"
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
