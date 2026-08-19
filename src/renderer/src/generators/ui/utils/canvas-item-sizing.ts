import type { CSSProperties } from 'react'
import type { SizeValue } from '../components/settings/style/types'

type SizedComponent = {
    style?: {
        size?: {
            width?: SizeValue
            height?: SizeValue
            minWidth?: SizeValue
            maxWidth?: SizeValue
            minHeight?: SizeValue
            maxHeight?: SizeValue
        }
    }
    properties?: {
        className?: string
    }
}

/**
 * Canvas DnD wrappers are the flex/grid items. Apply the component's
 * `properties.className` as-is (the user can type any utilities) and turn
 * arbitrary `[…]` tokens into inline styles so they still preview — Studio
 * Tailwind does not scan runtime class strings the way generated Next does.
 */

const ARBITRARY_RE = /^(?:(?:sm|md|lg|xl|2xl):)*(.+)-\[(.+)\]$/

const ARBITRARY_TO_STYLE: Record<string, keyof CSSProperties | (keyof CSSProperties)[]> = {
    w: 'width',
    h: 'height',
    'min-w': 'minWidth',
    'max-w': 'maxWidth',
    'min-h': 'minHeight',
    'max-h': 'maxHeight',
    size: ['width', 'height'],
    basis: 'flexBasis',
    grow: 'flexGrow',
    shrink: 'flexShrink',
    flex: 'flex',
    gap: 'gap',
    'gap-x': 'columnGap',
    'gap-y': 'rowGap',
    p: 'padding',
    px: 'paddingInline',
    py: 'paddingBlock',
    pt: 'paddingTop',
    pr: 'paddingRight',
    pb: 'paddingBottom',
    pl: 'paddingLeft',
    m: 'margin',
    mx: 'marginInline',
    my: 'marginBlock',
    mt: 'marginTop',
    mr: 'marginRight',
    mb: 'marginBottom',
    ml: 'marginLeft',
    inset: 'inset',
    top: 'top',
    right: 'right',
    bottom: 'bottom',
    left: 'left',
    rounded: 'borderRadius'
}

function sizeValueToCss(size?: SizeValue): string | undefined {
    if (!size?.value) return undefined
    if (size.unit === 'auto') return 'auto'
    return `${size.value}${size.unit}`
}

function applyArbitraryToken(token: string, style: CSSProperties): void {
    const match = ARBITRARY_RE.exec(token)
    if (!match) return
    const [, prefix, raw] = match
    const keys = ARBITRARY_TO_STYLE[prefix]
    if (!keys) return
    const value = raw.replace(/_/g, ' ')
    for (const key of Array.isArray(keys) ? keys : [keys]) {
        ;(style as Record<string, string>)[key as string] = value
    }
}

export function getCanvasItemSizing(comp: SizedComponent): {
    className: string
    style: CSSProperties | undefined
} {
    const size = comp.style?.size
    const className = comp.properties?.className ?? ''
    const style: CSSProperties = {}

    const width = sizeValueToCss(size?.width)
    const height = sizeValueToCss(size?.height)
    const minWidth = sizeValueToCss(size?.minWidth)
    const maxWidth = sizeValueToCss(size?.maxWidth)
    const minHeight = sizeValueToCss(size?.minHeight)
    const maxHeight = sizeValueToCss(size?.maxHeight)

    if (width) style.width = width
    if (height) style.height = height
    if (minWidth) style.minWidth = minWidth
    if (maxWidth) style.maxWidth = maxWidth
    if (minHeight) style.minHeight = minHeight
    if (maxHeight) style.maxHeight = maxHeight

    className.split(/\s+/).forEach((token) => applyArbitraryToken(token, style))

    return {
        className,
        style: Object.keys(style).length > 0 ? style : undefined
    }
}
