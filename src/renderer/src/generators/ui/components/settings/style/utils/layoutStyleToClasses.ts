// utils/layoutStyleToClasses.ts
import type { LayoutStyle } from '../types'

function getDisplayClass(type: LayoutStyle['type']): string {
    const map: Record<LayoutStyle['type'], string> = {
        block: 'block',
        flex: 'flex',
        grid: 'grid',
        'inline-block': 'inline-block',
        'inline-flex': 'inline-flex',
        'inline-grid': 'inline-grid',
        inline: 'inline',
        none: 'hidden'
    }
    return map[type]
}

export function layoutStyleToClasses(layout: LayoutStyle): string {
    const classes: string[] = []

    // Display type
    classes.push(getDisplayClass(layout.type))

    // Flex layout
    if (layout.flex && (layout.type === 'flex' || layout.type === 'inline-flex')) {
        const { direction, wrap, alignItems, justifyContent, gap } = layout.flex

        // Direction
        classes.push(
            direction === 'row'
                ? 'flex-row'
                : direction === 'row-reverse'
                  ? 'flex-row-reverse'
                  : direction === 'column'
                    ? 'flex-col'
                    : direction === 'column-reverse'
                      ? 'flex-col-reverse'
                      : ''
        )

        // Wrap
        classes.push(
            wrap === 'nowrap'
                ? 'flex-nowrap'
                : wrap === 'wrap'
                  ? 'flex-wrap'
                  : wrap === 'wrap-reverse'
                    ? 'flex-wrap-reverse'
                    : ''
        )

        // Alignment
        classes.push(
            alignItems === 'flex-start'
                ? 'items-start'
                : alignItems === 'flex-end'
                  ? 'items-end'
                  : alignItems === 'center'
                    ? 'items-center'
                    : alignItems === 'baseline'
                      ? 'items-baseline'
                      : alignItems === 'stretch'
                        ? 'items-stretch'
                        : ''
        )

        // Justification
        classes.push(
            justifyContent === 'flex-start'
                ? 'justify-start'
                : justifyContent === 'flex-end'
                  ? 'justify-end'
                  : justifyContent === 'center'
                    ? 'justify-center'
                    : justifyContent === 'space-between'
                      ? 'justify-between'
                      : justifyContent === 'space-around'
                        ? 'justify-around'
                        : justifyContent === 'space-evenly'
                          ? 'justify-evenly'
                          : ''
        )

        // Gap
        if (gap && !isNaN(Number(gap.replace('px', '')))) {
            const gapValue = gap.replace('px', '')
            classes.push(`gap-${gapValue}`)
        }
    }

    // Grid layout
    if (layout.grid && (layout.type === 'grid' || layout.type === 'inline-grid')) {
        classes.push('grid')

        // Grid template
        if (layout.grid.templateColumns) {
            classes.push(`grid-cols-${layout.grid.templateColumns}`)
        }
        if (layout.grid.templateRows) {
            classes.push(`grid-rows-${layout.grid.templateRows}`)
        }

        // Grid gap
        if (layout.grid.gap && !isNaN(Number(layout.grid.gap.replace('px', '')))) {
            const gapValue = layout.grid.gap.replace('px', '')
            classes.push(`gap-${gapValue}`)
        }

        // Grid alignment
        classes.push(
            layout.grid.justifyItems === 'start'
                ? 'justify-items-start'
                : layout.grid.justifyItems === 'end'
                  ? 'justify-items-end'
                  : layout.grid.justifyItems === 'center'
                    ? 'justify-items-center'
                    : layout.grid.justifyItems === 'stretch'
                      ? 'justify-items-stretch'
                      : ''
        )

        classes.push(
            layout.grid.alignItems === 'start'
                ? 'items-start'
                : layout.grid.alignItems === 'end'
                  ? 'items-end'
                  : layout.grid.alignItems === 'center'
                    ? 'items-center'
                    : layout.grid.alignItems === 'stretch'
                      ? 'items-stretch'
                      : ''
        )
    }

    return classes.filter((c) => c !== '').join(' ')
}
