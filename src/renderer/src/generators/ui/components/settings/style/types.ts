// First, update your types.ts (or wherever you define LayoutStyle)
export interface FlexProperties {
    direction: string;
    wrap: string;
    alignItems: string;
    justifyContent: string;
    gap: string;
}

export interface GridProperties {
    templateColumns: string;
    templateRows: string;
    gap: string;
    justifyItems: string;
    alignItems: string;
    direction: string;
    dense: boolean;
}

export interface BlockProperties {
    // Add block-specific properties here if needed
}

export type LayoutType = 'block' | 'flex' | 'grid' | 'inline-block' | 'inline-flex' | 'inline-grid' | 'inline' | 'none';

export interface LayoutStyle {
    type: LayoutType;
    flex: FlexProperties;
    grid: GridProperties;
    block: BlockProperties;
}

//spacing
export type Side = 'top' | 'right' | 'bottom' | 'left';
export type SpacingType = 'margin' | 'padding';
export type Unit = 'px' | 'rem' | '%' | 'em' | 'auto';

export interface SpacingValue {
    value: string;
    unit: Unit;
}

type SpacingValues = Record<Side, SpacingValue>;
export type SpacingSytle = Record<SpacingType, SpacingValues>;

// size.ts
export interface SizeValue {
    value: string;
    unit: string;
}

export interface SizeSytle {
    width: SizeValue;
    height: SizeValue;
    minWidth: SizeValue;
    maxWidth: SizeValue;
    minHeight: SizeValue;
    maxHeight: SizeValue;
    aspectRatio: string;
    overflowX: string;
    overflowY: string;
    aspectRatioLocked: boolean;
}

export interface StyleComponent {
    layout?: LayoutStyle;
    spacing?: SpacingSytle;
    size?: SizeSytle;
}

export interface SectionProps {
    onChangeStyles: (styles: StyleComponent) => void;
    styles: StyleComponent;
}
