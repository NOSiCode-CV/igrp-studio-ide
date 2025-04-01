import React from 'react';
import type { BackgroundValue } from '../../effects/types';

interface ImageEditorProps {
  background: BackgroundValue;
  onChange: (background: BackgroundValue) => void;
}

export function ImageEditor({ background, onChange }: ImageEditorProps) {
  return (
    <div className="space-y-0.5">
      <label className="text-[9px] text-gray-500">Image URL</label>
      <input
        type="text"
        value={background.value as string}
        onChange={(e) => onChange({ ...background, value: e.target.value })}
        placeholder="Enter image URL"
        className="w-full px-1.5 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}