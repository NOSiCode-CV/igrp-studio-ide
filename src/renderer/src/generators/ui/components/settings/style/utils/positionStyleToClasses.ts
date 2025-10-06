import type { PositionStyle, PositionValue, Side } from '../types';

function isValidTailwindUnit(unit: string) {
    return ['px', '%', 'rem', 'em', 'vw', 'vh'].includes(unit);
}

function getSideClass(
    side: Side,
    value: PositionValue,
    _linked: boolean
): string {
    if (!value.value) return '';
    const isNumeric = !isNaN(Number(value.value));
    const val = isNumeric ? `${value.value}${value.unit}` : value.value;

    if (!isValidTailwindUnit(value.unit) && value.unit !== 'auto') {
        return '';
    }

    // Tailwind supports arbitrary values with square brackets
    return value.value === 'auto' ? `${side}-auto` : `${side}-[${val}]`;
}

export function positionStyleToClasses(style: PositionStyle): string {
    const classes: string[] = [];

    // Position type
    classes.push(style.type); // e.g., 'absolute', 'relative', etc.

    // Sides (top, right, bottom, left)
    if (style.type !== 'static') {
        if (style.linked) {
            // Apply only one side if all are the same
            const first = style.positions.top;
            const allEqual = ['top', 'right', 'bottom', 'left'].every(
                (side) =>
                    style.positions[side as Side].value === first.value &&
                    style.positions[side as Side].unit === first.unit
            );

            if (allEqual && first.value) {
                classes.push(getSideClass('top', first, true)); // Just push once
            } else {
                for (const side of [
                    'top',
                    'right',
                    'bottom',
                    'left',
                ] as Side[]) {
                    const cls = getSideClass(
                        side,
                        style.positions[side],
                        false
                    );
                    if (cls) classes.push(cls);
                }
            }
        } else {
            for (const side of ['top', 'right', 'bottom', 'left'] as Side[]) {
                const cls = getSideClass(side, style.positions[side], false);
                if (cls) classes.push(cls);
            }
        }

        // z-index
        if (style.zIndex) {
            const z = isNaN(Number(style.zIndex))
                ? `z-[${style.zIndex}]`
                : `z-[${parseInt(style.zIndex)}]`;
            classes.push(z);
        }
    }

    return classes.filter((c) => c !== '').join(' ');
}
