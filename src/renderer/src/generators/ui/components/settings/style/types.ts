import { BackgroundStyle, FilterValue, OutlineValue, ShadowValue, TransformValue, TransitionValue } from "./components/effects/types";

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


//Typography
export interface TypographyValue {
    value: string;
    unit: string;
}

export interface TypographyStyle {
    fontSize: TypographyValue;
    lineHeight: TypographyValue;
    letterSpacing: TypographyValue;
    wordSpacing: TypographyValue;
    textAlign: string;
    fontWeight: string;
    fontStyle: string;
    textDecoration: string;
    textTransform: string;
    fontFamily: string;
}

//Borders
export interface BorderValue {
    width: string;
    style: string;
    color: string;
}

export interface BorderRadius {
    topLeft: string;
    topRight: string;
    bottomRight: string;
    bottomLeft: string;
}

export interface BordersStyle {
    borders: Record<string, BorderValue>;
    borderRadius: BorderRadius;
}

//Position

export interface PositionValue {
    value: string;
    unit: string;
}

export type PositionType = 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';

export interface PositionStyle {
    type: PositionType;
    positions: Record<Side, PositionValue>;
    zIndex: string;
    linked: boolean;
}

//Efects

export interface EffectsStyle {
    opacity: string;
    mixBlendMode: string;
    cursor: string;
    outline: OutlineValue;
    linkedShadow: boolean;
    boxShadows: ShadowValue[];
    filters: FilterValue[];
    backdropFilters: FilterValue[];
    transforms: TransformValue[];
    transitions: TransitionValue[];
}

export interface CustomProperty {
    name: string;
    value: string;
}

export interface CustomPropertiesStyle {
    properties: CustomProperty[];
}

export interface StyleComponent {
    layout?: LayoutStyle;
    spacing?: SpacingSytle;
    size?: SizeSytle;
    typography?: TypographyStyle;
    borders?: BordersStyle;
    position?: PositionStyle;
    backgrounds?: BackgroundStyle[]
    effects?: EffectsStyle
    customProperties?: CustomPropertiesStyle;
}

export interface SectionProps {
    onChangeStyles: (styles: StyleComponent) => void;
    styles: StyleComponent;
    resetStyles: (sectionKey: keyof StyleComponent) => void;
}
