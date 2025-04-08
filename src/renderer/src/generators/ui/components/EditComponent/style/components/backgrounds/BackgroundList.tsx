import React from 'react';
import { BackgroundListItem } from './BackgroundListItem';
import type { BackgroundValue } from '../effects/types';

interface BackgroundListProps {
  backgrounds: BackgroundValue[];
  editingIndex: number | null;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
  onChange: (index: number, background: BackgroundValue) => void;
}

export function BackgroundList({
  backgrounds,
  editingIndex,
  onEdit,
  onRemove,
  onChange
}: BackgroundListProps) {
  return (
    <div className="space-y-1">
      {backgrounds.map((background, index) => (
        <BackgroundListItem
          key={index}
          background={background}
          index={index}
          isEditing={editingIndex === index}
          onEdit={() => onEdit(index)}
          onRemove={() => onRemove(index)}
          onChange={(updatedBackground) => onChange(index, updatedBackground)}
        />
      ))}
    </div>
  );
}