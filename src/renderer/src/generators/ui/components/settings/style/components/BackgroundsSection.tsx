import { useState } from 'react';
import { Image, Palette, BadgeCent as Gradient, Layers } from 'lucide-react';
import { BackgroundList } from './backgrounds/BackgroundList';
import type { BackgroundValue } from './effects/types';

export function BackgroundsSection() {
  const [backgrounds, setBackgrounds] = useState<BackgroundValue[]>([{
    type: 'color',
    value: '#FFFFFF',
    size: 'cover',
    position: 'center',
    repeat: 'no-repeat',
    attachment: 'scroll',
    blendMode: 'normal'
  }]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const addBackground = (type: 'color' | 'image' | 'gradient') => {
    const newBackground: BackgroundValue = {
      type,
      value: type === 'color' ? '#FFFFFF' : 
             type === 'image' ? '' :
             {
               type: 'linear',
               angle: '90',
               stops: [
                 { color: '#FFFFFF', position: '0' },
                 { color: '#000000', position: '100' }
               ]
             },
      size: 'cover',
      position: 'center',
      repeat: 'no-repeat',
      attachment: 'scroll',
      blendMode: 'normal'
    };
    setBackgrounds([...backgrounds, newBackground]);
  };

  const removeBackground = (index: number) => {
    setBackgrounds(backgrounds.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const updateBackground = (index: number, background: BackgroundValue) => {
    const newBackgrounds = [...backgrounds];
    newBackgrounds[index] = background;
    setBackgrounds(newBackgrounds);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
          <Layers size={10} />
          Backgrounds
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => addBackground('color')}
            className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Add color"
          >
            <Palette size={10} />
          </button>
          <button
            onClick={() => addBackground('image')}
            className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Add image"
          >
            <Image size={10} />
          </button>
          <button
            onClick={() => addBackground('gradient')}
            className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Add gradient"
          >
            <Gradient size={10} />
          </button>
        </div>
      </div>

      <BackgroundList
        backgrounds={backgrounds}
        editingIndex={editingIndex}
        onEdit={setEditingIndex}
        onRemove={removeBackground}
        onChange={updateBackground}
      />
    </div>
  );
}