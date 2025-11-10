// utils/spacingToClasses.ts

import { SpacingSytle } from '../types'

export function spacingToClasses(spacing: SpacingSytle): string {
  const classes: string[] = []

  // Map Tailwind class prefixes to spacing types
  const prefixMap = {
    margin: 'm',
    padding: 'p'
  }

  // Map sides to their abbreviations
  const sideMap = {
    top: 't',
    right: 'r',
    bottom: 'b',
    left: 'l'
  }

  // Process both margin and padding
  ;(['margin', 'padding'] as const).forEach((type) => {
    const prefix = prefixMap[type]
    const values = spacing[type]

    // Process each side
    ;(['top', 'right', 'bottom', 'left'] as const).forEach((side) => {
      const { value, unit } = values[side]
      const sideAbbr = sideMap[side]

      // Skip zero values (Tailwind's default)
      if (value === '0') return

      // Handle auto
      if (unit === 'auto') {
        classes.push(`${prefix}${sideAbbr}-auto`)
        return
      }

      // Handle other units
      let tailwindValue = value
      if (unit !== 'px') {
        tailwindValue = `${value}${unit}`
      }

      classes.push(`${prefix}${sideAbbr}-${tailwindValue}`)
    })

    // Add x-axis and y-axis shortcuts if all sides match
    if (values.left.value === values.right.value && values.left.unit === values.right.unit) {
      if (values.left.value !== '0') {
        const xValue =
          values.left.unit === 'px' ? values.left.value : `${values.left.value}${values.left.unit}`
        classes.push(`${prefix}x-${xValue}`)
      }
    }

    if (values.top.value === values.bottom.value && values.top.unit === values.bottom.unit) {
      if (values.top.value !== '0') {
        const yValue =
          values.top.unit === 'px' ? values.top.value : `${values.top.value}${values.top.unit}`
        classes.push(`${prefix}y-${yValue}`)
      }
    }
  })

  return classes.join(' ')
}
