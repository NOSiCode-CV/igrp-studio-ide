import { BackgroundStyle } from '../components/effects/types'

export function backgroundToTailwind(background: BackgroundStyle): string {
  const {
    type,
    value,
    size = 'cover',
    position = 'center',
    repeat = 'no-repeat',
    attachment = 'scroll',
    blendMode = 'normal'
  } = background

  const twClasses: string[] = []

  // Background value
  if (type === 'color' && typeof value === 'string') {
    twClasses.push(`bg-[${value}]`)
  }

  if (type === 'image' && typeof value === 'string') {
    twClasses.push(`bg-[url('${value}')]`)
  }

  if (type === 'gradient' && typeof value !== 'string') {
    const angle = value.angle || '90'
    const stops = value.stops.map((stop) => `${stop.color} ${stop.position}%`).join(', ')

    // Use arbitrary value since Tailwind doesn’t support dynamic gradients out of the box
    twClasses.push(`bg-[linear-gradient(${angle}deg, ${stops})]`)
  }

  // Other background properties
  if (size) twClasses.push(`bg-${size}`)
  if (position) twClasses.push(`bg-${position}`)
  if (repeat) twClasses.push(`bg-${repeat}`)
  if (attachment) twClasses.push(`bg-${attachment}`)
  if (blendMode) twClasses.push(`mix-blend-${blendMode}`)

  return twClasses.join(' ')
}

export function backgroundsStyleToClasses(backgrounds: BackgroundStyle[]): string {
  return backgrounds.map((bg) => backgroundToTailwind(bg)).join(' ')
}
