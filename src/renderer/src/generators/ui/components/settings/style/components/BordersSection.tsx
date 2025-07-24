import { useState, useEffect } from 'react';
import { Square, RefreshCw } from 'lucide-react';
import { BorderRadius, BordersStyle, BorderValue, SectionProps } from '../types';


export function BordersSection({ onChangeStyles, styles }: SectionProps) {
  const [bordersStyle, setBordersStyle] = useState<BordersStyle>(
    styles.borders || {
      borders: {
        all: { width: '1', style: 'solid', color: '#000000' },
        top: { width: '', style: 'solid', color: '#000000' },
        right: { width: '', style: 'solid', color: '#000000' },
        bottom: { width: '', style: 'solid', color: '#000000' },
        left: { width: '', style: 'solid', color: '#000000' }
      },
      borderRadius: {
        topLeft: '0',
        topRight: '0',
        bottomRight: '0',
        bottomLeft: '0'
      }
    }
  );

  const [individualBorders, setIndividualBorders] = useState(false);

  const borderStyles = [
    'solid',
    'dashed',
    'dotted',
    'double',
    'groove',
    'ridge',
    'inset',
    'outset',
    'none'
  ];

  const updateBordersStyle = (updates: Partial<BordersStyle>) => {
    setBordersStyle(prev => ({
      ...prev,
      ...updates,
      borders: {
        ...prev.borders,
        ...(updates.borders || {})
      },
      borderRadius: {
        ...prev.borderRadius,
        ...(updates.borderRadius || {})
      }
    }));
  };

  const updateBorder = (side: string, field: keyof BorderValue, value: string) => {
    updateBordersStyle({
      borders: {
        ...bordersStyle.borders,
        [side]: {
          ...bordersStyle.borders[side],
          [field]: value
        }
      }
    });
  };

  const updateAllBorders = (field: keyof BorderValue, value: string) => {
    const newBorders = { ...bordersStyle.borders };
    Object.keys(newBorders).forEach(side => {
      newBorders[side] = { ...newBorders[side], [field]: value };
    });
    updateBordersStyle({ borders: newBorders });
  };

  const updateBorderRadius = (corner: keyof BorderRadius, value: string) => {
    updateBordersStyle({
      borderRadius: {
        ...bordersStyle.borderRadius,
        [corner]: value
      }
    });
  };

  const resetBorders = () => {
    updateBordersStyle({
      borders: {
        all: { width: '1', style: 'solid', color: '#000000' },
        top: { width: '', style: 'solid', color: '#000000' },
        right: { width: '', style: 'solid', color: '#000000' },
        bottom: { width: '', style: 'solid', color: '#000000' },
        left: { width: '', style: 'solid', color: '#000000' }
      },
      borderRadius: {
        topLeft: '0',
        topRight: '0',
        bottomRight: '0',
        bottomLeft: '0'
      }
    });
    setIndividualBorders(false);
  };

  useEffect(() => {
    onChangeStyles({ borders: bordersStyle });
  }, [bordersStyle]);

  const renderBorderControls = () => {
    if (!individualBorders) {
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <label className="text-xs text-gray-500 dark:text-gray-400">Width</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  value={bordersStyle.borders.all.width}
                  onChange={(e) => updateAllBorders('width', e.target.value)}
                  className="w-14 px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-500">px</span>
              </div>
            </div>
            <div className="space-y-0.5">
              <label className="text-xs text-gray-500 dark:text-gray-400">Style</label>
              <select
                value={bordersStyle.borders.all.style}
                onChange={(e) => updateAllBorders('style', e.target.value)}
                className="w-full px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
              >
                {borderStyles.map(style => (
                  <option key={style} value={style}>
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-0.5">
            <label className="text-xs text-gray-500 dark:text-gray-400">Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={bordersStyle.borders.all.color}
                onChange={(e) => updateAllBorders('color', e.target.value)}
                className="w-8 h-[22px] rounded cursor-pointer"
              />
              <input
                type="text"
                value={bordersStyle.borders.all.color.toUpperCase()}
                onChange={(e) => updateAllBorders('color', e.target.value)}
                className="flex-1 px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {['top', 'right', 'bottom', 'left'].map(side => (
          <div key={side} className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize">
              {side} Border
            </label>
            <div className="grid grid-cols-[1fr,1fr,auto] gap-2 items-end">
              <div className="space-y-0.5">
                <label className="text-xs text-gray-500 dark:text-gray-400">Width</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    value={bordersStyle.borders[side].width}
                    onChange={(e) => updateBorder(side, 'width', e.target.value)}
                    className="w-14 px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-500">px</span>
                </div>
              </div>
              <div className="space-y-0.5">
                <label className="text-xs text-gray-500 dark:text-gray-400">Style</label>
                <select
                  value={bordersStyle.borders[side].style}
                  onChange={(e) => updateBorder(side, 'style', e.target.value)}
                  className="w-full px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                >
                  {borderStyles.map(style => (
                    <option key={style} value={style}>
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-none">
                <input
                  type="color"
                  value={bordersStyle.borders[side].color}
                  onChange={(e) => updateBorder(side, 'color', e.target.value)}
                  className="w-8 h-[22px] rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {/* Border Controls */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <Square size={10} />
            Border
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={resetBorders}
              className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Reset borders"
            >
              <RefreshCw size={10} />
            </button>
            <button
              onClick={() => setIndividualBorders(!individualBorders)}
              className={`px-2 py-0.5 rounded text-xs font-medium ${individualBorders
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
            >
              {individualBorders ? 'Individual' : 'All Sides'}
            </button>
          </div>
        </div>
        {renderBorderControls()}
      </div>

      {/* Border Radius */}
      <div className="space-y-1.5">
        <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300">Border Radius</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { key: 'topLeft', label: 'Top Left' },
            { key: 'topRight', label: 'Top Right' },
            { key: 'bottomLeft', label: 'Bottom Left' },
            { key: 'bottomRight', label: 'Bottom Right' }
          ].map(({ key, label }) => (
            <div key={key} className="space-y-0.5">
              <label className="text-xs text-gray-500 dark:text-gray-400">{label}</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  value={bordersStyle.borderRadius[key as keyof BorderRadius]}
                  onChange={(e) => updateBorderRadius(key as keyof BorderRadius, e.target.value)}
                  className="w-14 px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-500">px</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}