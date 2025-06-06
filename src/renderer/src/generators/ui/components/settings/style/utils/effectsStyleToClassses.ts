
import type { EffectsStyle } from "../types";

export function effectsToSyleClasses(effects: EffectsStyle): string {
    const {
        opacity,
        mixBlendMode,
        cursor,
        outline,
        boxShadows,
        filters,
        backdropFilters,
        transforms,
        transitions,
    } = effects;

    const classes: string[] = [];

    // Opacity
    if (opacity !== '100') classes.push(`opacity-[${opacity}]`);

    // Blend mode
    if (mixBlendMode !== 'normal') classes.push(`mix-blend-${mixBlendMode}`);

    // Cursor
    if (cursor !== 'default') classes.push(`cursor-${cursor}`);

    // Outline
    if (outline.width !== '0') {
        classes.push(
            `outline`,
            `outline-[${outline.width}px]`,
            `outline-${outline.style}`,
            `outline-[${outline.color}]`
        );
    }

    // Box shadows
    if (boxShadows.length > 0) {
        boxShadows.forEach(shadow => {
            const shadowStr = `${shadow.inset ? 'inset ' : ''}${shadow.x}px ${shadow.y}px ${shadow.blur}px ${shadow.spread}px ${shadow.color}`;
            classes.push(`shadow-[${shadowStr}]`);
        });
    }

    // Filters
    if (filters.length > 0) {
        const filterStr = filters
            .map(f => `${f.type}(${f.value})`)
            .join(' ');
        classes.push(`filter`, `filter-[${filterStr}]`);
    }

    // Backdrop filters
    if (backdropFilters.length > 0) {
        const backdropStr = backdropFilters
            .map(f => `${f.type}(${f.value})`)
            .join(' ');
        classes.push(`backdrop-filter`, `backdrop-filter-[${backdropStr}]`);
    }

    // Transforms
    if (transforms.length > 0) {
        const transformStr = transforms
            .map(t => `${t.type}(${t.value})`)
            .join(' ');
        classes.push(`transform`, `transform-[${transformStr}]`);
    }

    // Transitions
    if (transitions.length > 0) {
        const props = transitions.map(t => t.property).join(',');
        const duration = transitions[0]?.duration || '150ms';
        const timing = transitions[0]?.timingFunction || 'ease-in-out';
        const delay = transitions[0]?.delay || '0ms';

        classes.push(
            `transition-[${props}]`,
            `duration-[${duration}]`,
            `ease-[${timing}]`,
            `delay-[${delay}]`
        );
    }

    return classes.join(' ');
}
