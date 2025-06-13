import { Import } from "@igrp/igrp-studio-nextjs-engine/dist/interfaces/types";

// Shadow Types
export interface ShadowValue {
  x: string;
  y: string;
  blur: string;
  spread: string;
  color: string;
  inset: boolean;
}
export interface InteractionValue {
  fnCustomSet?: string;
  fnName?: string;
  fnCustomCode?: {
    fnCode?: string;
    imports?: Import[];
  }
}

// Filter Types
export interface FilterValue {
  type: string;
  value: string;
  unit: string;
}

export interface FilterType {
  name: string;
  min: string;
  max: string;
  unit: string;
}

export const filterTypes: FilterType[] = [
  { name: 'blur', min: '0', max: '20', unit: 'px' },
  { name: 'brightness', min: '0', max: '200', unit: '%' },
  { name: 'contrast', min: '0', max: '200', unit: '%' },
  { name: 'grayscale', min: '0', max: '100', unit: '%' },
  { name: 'hue-rotate', min: '0', max: '360', unit: 'deg' },
  { name: 'invert', min: '0', max: '100', unit: '%' },
  { name: 'opacity', min: '0', max: '100', unit: '%' },
  { name: 'saturate', min: '0', max: '200', unit: '%' },
  { name: 'sepia', min: '0', max: '100', unit: '%' }
];

// Transform Types
export interface TransformValue {
  type: string;
  value: string;
  unit: string;
}

export interface TransformType {
  name: string;
  units: string[];
}

export const transformTypes: TransformType[] = [
  { name: 'translate', units: ['px', '%', 'rem', 'em'] },
  { name: 'translateX', units: ['px', '%', 'rem', 'em'] },
  { name: 'translateY', units: ['px', '%', 'rem', 'em'] },
  { name: 'scale', units: [''] },
  { name: 'scaleX', units: [''] },
  { name: 'scaleY', units: [''] },
  { name: 'rotate', units: ['deg', 'turn', 'rad'] },
  { name: 'rotateX', units: ['deg', 'turn', 'rad'] },
  { name: 'rotateY', units: ['deg', 'turn', 'rad'] },
  { name: 'rotateZ', units: ['deg', 'turn', 'rad'] },
  { name: 'skew', units: ['deg', 'turn', 'rad'] },
  { name: 'skewX', units: ['deg', 'turn', 'rad'] },
  { name: 'skewY', units: ['deg', 'turn', 'rad'] },
  { name: 'perspective', units: ['px'] }
];

// Transition Types
export interface TransitionValue {
  property: string;
  duration: string;
  timing: string;
  delay: string;
}

export const transitionProperties = [
  'all',
  'background',
  'border',
  'color',
  'font-size',
  'height',
  'margin',
  'opacity',
  'padding',
  'transform',
  'width'
];

export const timingFunctions = [
  'linear',
  'ease',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'step-start',
  'step-end'
];

// Background Types
export interface GradientStop {
  color: string;
  position: string;
}

export interface GradientValue {
  type: 'linear' | 'radial' | 'conic';
  angle: string;
  stops: GradientStop[];
}

export interface BackgroundStyle {
  type: 'color' | 'image' | 'gradient';
  value: string | GradientValue;
  size: string;
  position: string;
  repeat: string;
  attachment: string;
  blendMode: string;
}

export interface OutlineValue {
  width: string;
  style: string;
  color: string;
}

export const backgroundSizes = [
  'cover',
  'contain',
  '100% 100%',
  'auto'
];

export const backgroundPositions = [
  'center',
  'top',
  'right',
  'bottom',
  'left',
  'top left',
  'top right',
  'bottom left',
  'bottom right'
];

export const backgroundRepeats = [
  'no-repeat',
  'repeat',
  'repeat-x',
  'repeat-y',
  'space',
  'round'
];

export const backgroundAttachments = [
  'scroll',
  'fixed',
  'local'
];

export const blendModes = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity'
];