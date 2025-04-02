import React, { useState } from 'react';
import { VisibilityControls } from './effects/VisibilityControls';
import { InteractionControls } from './effects/InteractionControls';
import { BoxShadowControls } from './effects/BoxShadowControls';
import { FilterControls } from './effects/FilterControls';
import { TransformControls } from './effects/TransformControls';
import { TransitionControls } from './effects/TransitionControls';
import type { 
  ShadowValue, 
  FilterValue, 
  TransformValue, 
  TransitionValue 
} from './effects/types';

export function EffectsSection() {
  const [opacity, setOpacity] = useState('100');
  const [mixBlendMode, setMixBlendMode] = useState('normal');
  const [cursor, setCursor] = useState('default');
  const [outline, setOutline] = useState({ width: '0', style: 'solid', color: '#000000' });
  const [linkedShadow, setLinkedShadow] = useState(true);
  const [boxShadows, setBoxShadows] = useState<ShadowValue[]>([{
    x: '0',
    y: '4',
    blur: '8',
    spread: '0',
    color: '#00000040',
    inset: false
  }]);
  const [filters, setFilters] = useState<FilterValue[]>([]);
  const [backdropFilters, setBackdropFilters] = useState<FilterValue[]>([]);
  const [transforms, setTransforms] = useState<TransformValue[]>([]);
  const [transitions, setTransitions] = useState<TransitionValue[]>([]);

  return (
    <div className="space-y-2">
      <VisibilityControls
        opacity={opacity}
        mixBlendMode={mixBlendMode}
        onOpacityChange={setOpacity}
        onBlendModeChange={setMixBlendMode}
        onReset={() => {
          setOpacity('100');
          setMixBlendMode('normal');
        }}
      />

      <InteractionControls
        cursor={cursor}
        outline={outline}
        onCursorChange={setCursor}
        onOutlineChange={(field, value) => setOutline({ ...outline, [field]: value })}
      />

      <BoxShadowControls
        shadows={boxShadows}
        linkedShadow={linkedShadow}
        onShadowsChange={setBoxShadows}
        onLinkedShadowChange={setLinkedShadow}
      />

      <FilterControls
        title="Filters"
        filters={filters}
        onFiltersChange={setFilters}
      />

      <FilterControls
        title="Backdrop Filters"
        filters={backdropFilters}
        onFiltersChange={setBackdropFilters}
      />

      <TransformControls
        transforms={transforms}
        onTransformsChange={setTransforms}
      />

      <TransitionControls
        transitions={transitions}
        onTransitionsChange={setTransitions}
      />
    </div>
  );
}