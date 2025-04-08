import React, { useRef, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { ColorEditor } from './editors/ColorEditor';
import { ImageEditor } from './editors/ImageEditor';
import { GradientEditor } from './editors/GradientEditor';
import { CommonControls } from './editors/CommonControls';
import { getBackgroundStyles } from './utils';
import type { BackgroundValue } from '../effects/types';

interface BackgroundEditorProps {
  background: BackgroundValue;
  index: number;
  onClose: () => void;
  onRemove: () => void;
  onChange: (background: BackgroundValue) => void;
}

export function BackgroundEditor({
  background,
  index,
  onClose,
  onRemove,
  onChange
}: BackgroundEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<'top' | 'bottom'>('bottom');

  useEffect(() => {
    function updatePosition() {
      if (!editorRef.current) return;

      const rect = editorRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      setPosition(spaceBelow >= 200 || spaceBelow > spaceAbove ? 'bottom' : 'top');
    }

    updatePosition();
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, []);

  return (
    <div 
      ref={editorRef}
      className={`absolute z-[99999] p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ${
        position === 'bottom' ? 'top-full mt-1' : 'bottom-full mb-1'
      }`}
      style={{
        right: '-1rem',
        width: '240px'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between pb-1 border-b border-gray-200 dark:border-gray-700">
          <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">
            Edit Background {index + 1}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X size={10} />
          </button>
        </div>

        {background.type === 'color' && <ColorEditor background={background} onChange={onChange} />}
        {background.type === 'image' && <ImageEditor background={background} onChange={onChange} />}
        {background.type === 'gradient' && <GradientEditor background={background} onChange={onChange} />}

        <CommonControls background={background} onChange={onChange} />

        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded">
          <div className="text-[9px] text-gray-500 mb-1">Preview</div>
          <div 
            className="w-full h-12 rounded border border-gray-200 dark:border-gray-700"
            style={getBackgroundStyles(background)}
          />
        </div>
      </div>
    </div>
  );
}