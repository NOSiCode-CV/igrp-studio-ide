import { useState, useEffect } from 'react'
import { VisibilityControls } from './effects/VisibilityControls'
import { InteractionControls } from './effects/InteractionControls'
import { BoxShadowControls } from './effects/BoxShadowControls'
import { FilterControls } from './effects/FilterControls'
import { TransformControls } from './effects/TransformControls'
import { TransitionControls } from './effects/TransitionControls'
import { EffectsStyle, SectionProps } from '../types'

const DEFAULT_EFFECTS: EffectsStyle = {
  opacity: '100',
  mixBlendMode: 'normal',
  cursor: 'default',
  outline: {
    width: '0',
    style: 'solid',
    color: '#000000'
  },
  boxShadows: [
    {
      x: '0',
      y: '4',
      blur: '8',
      spread: '0',
      color: '#00000040',
      inset: false
    }
  ],
  linkedShadow: true,
  filters: [],
  backdropFilters: [],
  transforms: [],
  transitions: []
}

export function EffectsSection({ styles, onChangeStyles }: SectionProps) {
  const [effects, setEffects] = useState<EffectsStyle>(styles.effects || DEFAULT_EFFECTS)

  // Sync local state with external style changes
  useEffect(() => {
    setEffects(styles.effects || DEFAULT_EFFECTS)
  }, [styles.effects])

  const updateEffect = <K extends keyof EffectsStyle>(key: K, value: EffectsStyle[K]) => {
    const updated = { ...effects, [key]: value }
    setEffects(updated)
    onChangeStyles({ effects: updated })
  }

  return (
    <div className="space-y-2">
      <VisibilityControls
        opacity={effects.opacity}
        mixBlendMode={effects.mixBlendMode}
        onOpacityChange={(v) => updateEffect('opacity', v)}
        onBlendModeChange={(v) => updateEffect('mixBlendMode', v)}
        onReset={() => {
          updateEffect('opacity', DEFAULT_EFFECTS.opacity)
          updateEffect('mixBlendMode', DEFAULT_EFFECTS.mixBlendMode)
        }}
      />

      <InteractionControls
        cursor={effects.cursor}
        outline={effects.outline}
        onCursorChange={(v) => updateEffect('cursor', v)}
        onOutlineChange={(field, value) =>
          updateEffect('outline', {
            ...effects.outline,
            [field]: value
          })
        }
      />

      <BoxShadowControls
        shadows={effects.boxShadows}
        linkedShadow={effects.linkedShadow}
        onShadowsChange={(v) => updateEffect('boxShadows', v)}
        onLinkedShadowChange={(v) => updateEffect('linkedShadow', v)}
      />

      <FilterControls
        title="Filters"
        filters={effects.filters}
        onFiltersChange={(v) => updateEffect('filters', v)}
      />

      <FilterControls
        title="Backdrop Filters"
        filters={effects.backdropFilters}
        onFiltersChange={(v) => updateEffect('backdropFilters', v)}
      />

      <TransformControls
        transforms={effects.transforms}
        onTransformsChange={(v) => updateEffect('transforms', v)}
      />

      <TransitionControls
        transitions={effects.transitions}
        onTransitionsChange={(v) => updateEffect('transitions', v)}
      />
    </div>
  )
}
