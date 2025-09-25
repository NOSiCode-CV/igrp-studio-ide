// utils/bordersStyleToClasses.ts
import type { BorderValue, BorderRadius, BordersStyle } from '../types';

function getBorderWidthClass(width: string): string {
    if (!width) return '';
    const size = parseInt(width);
    // Map common border widths to Tailwind classes
    const widthMap: Record<number, string> = {
        0: 'border-0',
        1: 'border',
        2: 'border-2',
        4: 'border-4',
        8: 'border-8',
    };
    return widthMap[size] || `border-[${width}px]`;
}

function getBorderStyleClass(style: string): string {
    const styleMap: Record<string, string> = {
        solid: 'border-solid',
        dashed: 'border-dashed',
        dotted: 'border-dotted',
        double: 'border-double',
        none: 'border-none',
    };
    return styleMap[style] || '';
}

function getBorderColorClass(color: string): string {
    if (!color) return '';
    // Check if it's a hex color
    if (color.startsWith('#')) {
        return `border-[${color}]`;
    }
    // Could add named color mappings here if needed
    return `border-[${color}]`;
}

function getBorderSideClasses(side: string, border: BorderValue): string[] {
    const classes: string[] = [];
    if (!border.width) return classes;

    const sidePrefix = side === 'all' ? 'border' : `border-${side}`;

    // Width
    if (side === 'all') {
        classes.push(getBorderWidthClass(border.width));
    } else {
        classes.push(border.width ? `${sidePrefix}-[${border.width}px]` : '');
    }

    // Style
    if (side === 'all') {
        classes.push(getBorderStyleClass(border.style));
    } else {
        classes.push(border.style ? `${sidePrefix}-${border.style}` : '');
    }

    // Color
    if (side === 'all') {
        classes.push(getBorderColorClass(border.color));
    } else {
        classes.push(border.color ? `${sidePrefix}-[${border.color}]` : '');
    }

    return classes.filter((c) => c !== '');
}

function getBorderRadiusClass(corner: string, value: string): string {
    if (!value || value === '0') return '';
    const size = parseInt(value);

    // Map common radius values
    const radiusMap: Record<number, string> = {
        0: 'rounded-none',
        1: 'rounded-sm',
        2: 'rounded',
        4: 'rounded-md',
        6: 'rounded-lg',
        8: 'rounded-xl',
        12: 'rounded-2xl',
        16: 'rounded-3xl',
        24: 'rounded-full',
    };

    const cornerPrefix = corner === 'all' ? 'rounded' : `rounded-${corner}`;

    if (corner === 'all') {
        return radiusMap[size] || `rounded-[${value}px]`;
    }

    return radiusMap[size]
        ? `${cornerPrefix}-${radiusMap[size].split('-')[1]}`
        : `${cornerPrefix}-[${value}px]`;
}

export function bordersStyleToClasses(style: BordersStyle): string {
    const { borders, borderRadius } = style;

    const classes: string[] = [];

    // Process borders
    if (borders.all.width) {
        // All sides have the same border
        classes.push(...getBorderSideClasses('all', borders.all));
    } else {
        // Individual borders
        ['top', 'right', 'bottom', 'left'].forEach((side) => {
            if (borders[side].width) {
                classes.push(...getBorderSideClasses(side, borders[side]));
            }
        });
    }

    // Process border radius
    const allCornersSame =
        borderRadius.topLeft === borderRadius.topRight &&
        borderRadius.topRight === borderRadius.bottomRight &&
        borderRadius.bottomRight === borderRadius.bottomLeft;

    if (allCornersSame && borderRadius.topLeft !== '0') {
        classes.push(getBorderRadiusClass('all', borderRadius.topLeft));
    } else {
        (Object.keys(borderRadius) as Array<keyof BorderRadius>).forEach(
            (corner) => {
                if (borderRadius[corner] !== '0') {
                    classes.push(
                        getBorderRadiusClass(
                            corner
                                .toLowerCase()
                                .replace('left', 'l')
                                .replace('right', 'r'),
                            borderRadius[corner]
                        )
                    );
                }
            }
        );
    }

    return classes.filter((c) => c !== '').join(' ');
}
