// utils/typographyStyleToClasses.ts
import type { TypographyStyle } from '../types'

function getFontSizeClass(value: string, unit: string): string {
    if (unit === 'px') {
        const size = parseInt(value)
        // Map common px values to Tailwind's text-* classes
        const sizeMap: Record<number, string> = {
            12: 'text-xs',
            14: 'text-sm',
            16: 'text-base',
            18: 'text-lg',
            20: 'text-xl',
            24: 'text-2xl',
            30: 'text-3xl',
            36: 'text-4xl',
            48: 'text-5xl',
            60: 'text-6xl',
            72: 'text-7xl',
            96: 'text-8xl',
            128: 'text-9xl'
        }
        return sizeMap[size] || `text-[${value}${unit}]`
    }
    return `text-[${value}${unit}]`
}

function getLineHeightClass(value: string, unit: string): string {
    if (unit === 'em' || unit === 'rem') {
        const numericValue = parseFloat(value)
        // Map common line heights to Tailwind's leading-* classes
        const lineHeightMap: Record<number, string> = {
            0.75: 'leading-3',
            1: 'leading-4',
            1.25: 'leading-5',
            1.5: 'leading-6',
            1.75: 'leading-7',
            2: 'leading-8',
            2.25: 'leading-9',
            2.5: 'leading-10'
        }
        return lineHeightMap[numericValue] || `leading-[${value}${unit}]`
    }
    return `leading-[${value}${unit}]`
}

function getSpacingClass(value: string, unit: string, prefix: string): string {
    if (unit === 'px') {
        const size = parseInt(value)
        // Map common spacing values to Tailwind classes
        const spacingMap: Record<number, string> = {
            0: `${prefix}-0`,
            1: `${prefix}-1`,
            2: `${prefix}-2`,
            4: `${prefix}-4`,
            8: `${prefix}-8`,
            12: `${prefix}-12`,
            16: `${prefix}-16`,
            20: `${prefix}-20`,
            24: `${prefix}-24`,
            32: `${prefix}-32`,
            40: `${prefix}-40`,
            48: `${prefix}-48`,
            56: `${prefix}-56`,
            64: `${prefix}-64`
        }
        return spacingMap[size] || `${prefix}-[${value}${unit}]`
    }
    return `${prefix}-[${value}${unit}]`
}

export function typographyStyleToClasses(typography: TypographyStyle): string {
    const classes: string[] = []

    // Font family
    if (typography.fontFamily) {
        classes.push(`font-${typography.fontFamily.toLowerCase().replace(' ', '-')}`)
    }

    // Font size
    if (typography.fontSize) {
        classes.push(getFontSizeClass(typography.fontSize.value, typography.fontSize.unit))
    }

    // Line height
    if (typography.lineHeight) {
        classes.push(getLineHeightClass(typography.lineHeight.value, typography.lineHeight.unit))
    }

    // Letter spacing
    if (typography.letterSpacing) {
        classes.push(
            getSpacingClass(
                typography.letterSpacing.value,
                typography.letterSpacing.unit,
                'tracking'
            )
        )
    }

    // Word spacing
    if (typography.wordSpacing) {
        classes.push(
            getSpacingClass(
                typography.wordSpacing.value,
                typography.wordSpacing.unit,
                'word-spacing'
            )
        )
    }

    // Text align
    if (typography.textAlign) {
        classes.push(
            typography.textAlign === 'left'
                ? 'text-left'
                : typography.textAlign === 'center'
                  ? 'text-center'
                  : typography.textAlign === 'right'
                    ? 'text-right'
                    : typography.textAlign === 'justify'
                      ? 'text-justify'
                      : ''
        )
    }

    // Font weight
    if (typography.fontWeight) {
        classes.push(
            typography.fontWeight === '100'
                ? 'font-thin'
                : typography.fontWeight === '200'
                  ? 'font-extralight'
                  : typography.fontWeight === '300'
                    ? 'font-light'
                    : typography.fontWeight === '400'
                      ? 'font-normal'
                      : typography.fontWeight === '500'
                        ? 'font-medium'
                        : typography.fontWeight === '600'
                          ? 'font-semibold'
                          : typography.fontWeight === '700'
                            ? 'font-bold'
                            : typography.fontWeight === '800'
                              ? 'font-extrabold'
                              : typography.fontWeight === '900'
                                ? 'font-black'
                                : ''
        )
    }

    // Font style
    if (typography.fontStyle) {
        classes.push(
            typography.fontStyle === 'italic'
                ? 'italic'
                : typography.fontStyle === 'normal'
                  ? 'not-italic'
                  : ''
        )
    }

    // Text decoration
    if (typography.textDecoration) {
        classes.push(
            typography.textDecoration === 'underline'
                ? 'underline'
                : typography.textDecoration === 'line-through'
                  ? 'line-through'
                  : typography.textDecoration === 'overline'
                    ? 'overline'
                    : typography.textDecoration === 'none'
                      ? 'no-underline'
                      : ''
        )
    }

    // Text transform
    if (typography.textTransform) {
        classes.push(
            typography.textTransform === 'uppercase'
                ? 'uppercase'
                : typography.textTransform === 'lowercase'
                  ? 'lowercase'
                  : typography.textTransform === 'capitalize'
                    ? 'capitalize'
                    : typography.textTransform === 'none'
                      ? 'normal-case'
                      : ''
        )
    }

    return classes.filter((c) => c !== '').join(' ')
}
