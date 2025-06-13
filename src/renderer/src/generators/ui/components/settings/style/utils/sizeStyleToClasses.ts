import { SizeSytle, SizeValue } from "../types";

export function sizeStyleToClasses(sizeState: SizeSytle): string {
    const classes: string[] = [];

    // Helper to generate dimension classes
    const addSizeClass = (size: SizeValue, prefix: string) => {
        if (!size.value) return; // Skip empty values

        if (size.unit === 'auto') {
            classes.push(`${prefix}-auto`);
            return;
        }

        // Handle pixel values that match Tailwind's scale (0-96, multiples of 4)
        if (size.unit === 'px' && /^\d+$/.test(size.value)) {
            const pxValue = parseInt(size.value);
            if (pxValue >= 0 && pxValue <= 96 && pxValue % 4 === 0) {
                classes.push(`${prefix}-${pxValue}`);
                return;
            }
        }

        // Fallback to arbitrary values
        classes.push(`${prefix}-[${size.value}${size.unit}]`);
    };

    // Dimensions
    addSizeClass(sizeState.width, 'w');
    addSizeClass(sizeState.height, 'h');
    addSizeClass(sizeState.minWidth, 'min-w');
    addSizeClass(sizeState.maxWidth, 'max-w');
    addSizeClass(sizeState.minHeight, 'min-h');
    addSizeClass(sizeState.maxHeight, 'max-h');

    // Aspect Ratio
    if (sizeState.aspectRatio) {
        const ratio = sizeState.aspectRatio.replace('/', '_');
        classes.push(`aspect-[${ratio}]`);
    }

    // Overflow
    if (sizeState.overflowX === sizeState.overflowY) {
        classes.push(`overflow-${sizeState.overflowX}`);
    } else {
        classes.push(
            `overflow-x-${sizeState.overflowX}`,
            `overflow-y-${sizeState.overflowY}`
        );
    }

    return classes.filter(c => c).join(' ');
}