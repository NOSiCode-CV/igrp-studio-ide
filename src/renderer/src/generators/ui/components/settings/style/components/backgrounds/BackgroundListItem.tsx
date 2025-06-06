import { useRef, useEffect } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { BackgroundEditor } from './BackgroundEditor';
import { getBackgroundStyles } from './utils';
import type { BackgroundStyle } from '../effects/types';
import { useTranslation } from 'react-i18next';

interface BackgroundListItemProps {
  background: BackgroundStyle;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onRemove: () => void;
  onChange: (background: BackgroundStyle) => void;
}

export function BackgroundListItem({
  background,
  index,
  isEditing,
  onEdit,
  onRemove,
  onChange
}: BackgroundListItemProps) {

  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {

    function handleClickOutside(event: MouseEvent) {
      if (
        isEditing &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onEdit();
      }
    }

    if (isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEditing, onEdit]);


  return (
    <div
      ref={containerRef}
      className="group relative flex items-center gap-2 p-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800 rounded transition-colors"
    >
      <div
        className="w-6 h-6 rounded border border-gray-200 dark:border-gray-700"
        style={getBackgroundStyles(background)}
      />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {background.type.charAt(0).toUpperCase() + background.type.slice(1)} {t('background')}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {background.type === 'gradient'
            ? `${(background.value as any).type} gradient`
            : background.type === 'image'
            ? background.value as string || 'No URL'
            : background.value as string}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <div className="relative">
          <button
            ref={buttonRef}
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            <Edit2 size={10} />
          </button>
          {isEditing && (
            <BackgroundEditor
              background={background}
              index={index}
              onClose={onEdit}
              onRemove={onRemove}
              onChange={onChange}
            />
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        >
          <Trash2 size={10} />
        </button>
      </div>
    </div>
  );
}
