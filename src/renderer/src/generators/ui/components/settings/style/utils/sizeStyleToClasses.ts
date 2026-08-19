import type { SizeSytle, SizeValue } from '../types'

export function sizeStyleToClasses(sizeState: SizeSytle): string {
    const classes: string[] = []

    // Helper to generate dimension classes
    const addSizeClass = (size: SizeValue, prefix: string) => {
        if (!size.value) return // Skip empty values

        if (size.unit === 'auto') {
            classes.push(`${prefix}-auto`)
            return
        }

        // Static utilities the Studio Tailwind build already contains.
        // Arbitrary values like `w-[100%]` are emitted by the generator and
        // work at runtime, but are invisible in the canvas JIT scan.
        if (size.value === '100' && size.unit === '%') {
            classes.push(`${prefix}-full`)
            return
        }
        if (size.value === '100' && size.unit === 'vw' && prefix === 'w') {
            classes.push('w-screen')
            return
        }
        if (size.value === '100' && size.unit === 'vh' && prefix === 'h') {
            classes.push('h-screen')
            return
        }
        if (size.value === 'full') {
            classes.push(`${prefix}-full`)
            return
        }

        // Handle pixel values that match Tailwind's scale (0-96, multiples of 4)
        if (size.unit === 'px' && /^\d+$/.test(size.value)) {
            const pxValue = parseInt(size.value)
            if (pxValue >= 0 && pxValue <= 96 && pxValue % 4 === 0) {
                classes.push(`${prefix}-${pxValue}`)
                return
            }
        }

        // Fallback to arbitrary values
        classes.push(`${prefix}-[${size.value}${size.unit}]`)
    }

    // Dimensions
    addSizeClass(sizeState.width, 'w')
    addSizeClass(sizeState.height, 'h')
    addSizeClass(sizeState.minWidth, 'min-w')
    addSizeClass(sizeState.maxWidth, 'max-w')
    addSizeClass(sizeState.minHeight, 'min-h')
    addSizeClass(sizeState.maxHeight, 'max-h')

    // Aspect Ratio
    if (sizeState.aspectRatio) {
        const ratio = sizeState.aspectRatio.replace('/', '_')
        classes.push(`aspect-[${ratio}]`)
    }

    // Overflow
    if (sizeState.overflowX === sizeState.overflowY) {
        classes.push(`overflow-${sizeState.overflowX}`)
    } else {
        classes.push(`overflow-x-${sizeState.overflowX}`, `overflow-y-${sizeState.overflowY}`)
    }

    return classes.filter((c) => c).join(' ')
}
