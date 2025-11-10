import { CustomPropertiesStyle } from '../types'

export const customPropertiesToClasses = (customProperties: CustomPropertiesStyle): string => {
  if (!customProperties.properties || customProperties.properties.length === 0) {
    return ''
  }

  const cssProperties = customProperties.properties
    .filter((prop) => prop.name && prop.value)
    .map((prop) => `--${prop.name}: ${prop.value}`)
    .join('; ')

  return cssProperties ? `[style*="${cssProperties}"]` : ''
}
