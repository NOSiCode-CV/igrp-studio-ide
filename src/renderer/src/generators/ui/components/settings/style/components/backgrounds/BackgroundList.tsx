import { BackgroundListItem } from './BackgroundListItem';
import type { BackgroundStyle } from '../effects/types';

interface BackgroundListProps {
  backgrounds: BackgroundStyle[];
  editingIndex: number | null;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
  onChange: (index: number, background: BackgroundStyle) => void;
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
