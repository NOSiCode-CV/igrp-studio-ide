import type { BackgroundValue, GradientValue } from '../effects/types';

export function getBackgroundPreview(background: BackgroundValue): string {
  if (background.type === 'color') {
    return background.value as string;
  } else if (background.type === 'image') {
    return `url("${background.value}")`;
  } else {
    const gradient = background.value as GradientValue;
    const stops = gradient.stops
      .map(stop => `${stop.color} ${stop.position}%`)
      .join(', ');
    
    return gradient.type === 'linear'
      ? `linear-gradient(${gradient.angle}deg, ${stops})`
      : gradient.type === 'radial'
      ? `radial-gradient(circle at center, ${stops})`
      : `conic-gradient(from ${gradient.angle}deg at center, ${stops})`;
  }
}

export function getBackgroundStyles(background: BackgroundValue): React.CSSProperties {
  return {
    backgroundImage: background.type === 'color' ? 'none' : getBackgroundPreview(background),
    backgroundColor: background.type === 'color' ? background.value as string : 'transparent',
    backgroundSize: background.size,
    backgroundPosition: background.position,
    backgroundRepeat: background.repeat,
    backgroundAttachment: background.attachment,
    backgroundBlendMode: background.blendMode
  };
}