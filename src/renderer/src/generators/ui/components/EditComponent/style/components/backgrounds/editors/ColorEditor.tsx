import type { BackgroundValue } from '../../effects/types';

interface ColorEditorProps {
  background: BackgroundValue;
  onChange: (background: BackgroundValue) => void;
}

export function ColorEditor({ background, onChange }: ColorEditorProps) {
  return (
    <div className="space-y-0.5">
      <label className="text-[9px] text-gray-500">Color</label>
      <div className="flex gap-1">
        <input
          type="color"
          value={background.value as string}
          onChange={(e) => onChange({ ...background, value: e.target.value })}
          className="w-8 h-[22px] rounded cursor-pointer"
        />
        <input
          type="text"
          value={background.value as string}
          onChange={(e) => onChange({ ...background, value: e.target.value })}
          className="flex-1 px-1.5 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}