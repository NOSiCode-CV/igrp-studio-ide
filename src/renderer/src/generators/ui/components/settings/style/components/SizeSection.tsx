import React, { useState } from 'react';
import { ArrowRight, ArrowDown, Lock, Unlock, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SizeValue {
  value: string;
  unit: string;
}

export function SizeSection() {
  const [aspectRatioLocked, setAspectRatioLocked] = useState(false);
  const [width, setWidth] = useState<SizeValue>({ value: '', unit: 'px' });
  const [height, setHeight] = useState<SizeValue>({ value: '', unit: 'px' });
  const [minWidth, setMinWidth] = useState<SizeValue>({ value: '', unit: 'px' });
  const [maxWidth, setMaxWidth] = useState<SizeValue>({ value: '', unit: 'px' });
  const [minHeight, setMinHeight] = useState<SizeValue>({ value: '', unit: 'px' });
  const [maxHeight, setMaxHeight] = useState<SizeValue>({ value: '', unit: 'px' });
  const [aspectRatio, setAspectRatio] = useState('');
  const [overflowX, setOverflowX] = useState('visible');
  const [overflowY, setOverflowY] = useState('visible');
  const { t } = useTranslation();

  const units = ['px', '%', 'rem', 'em', 'vw', 'vh', 'auto'];
  const commonAspectRatios = [
    { label: 'Square (1:1)', value: '1/1' },
    { label: '16:9', value: '16/9' },
    { label: '4:3', value: '4/3' },
    { label: '3:2', value: '3/2' },
    { label: '21:9', value: '21/9' },
  ];

  const overflowOptions = [
    { value: 'visible', label: 'Visible' },
    { value: 'hidden', label: 'Hidden' },
    { value: 'clip', label: 'Clip' },
    { value: 'scroll', label: 'Scroll' },
    { value: 'auto', label: 'Auto' },
  ];

  const handleWidthChange = (newWidth: SizeValue) => {
    setWidth(newWidth);
    if (aspectRatioLocked && aspectRatio && newWidth.value) {
      const [w, h] = aspectRatio.split('/').map(Number);
      const newHeightValue = (Number(newWidth.value) * h / w).toString();
      setHeight({ ...height, value: newHeightValue });
    }
  };

  const handleHeightChange = (newHeight: SizeValue) => {
    setHeight(newHeight);
    if (aspectRatioLocked && aspectRatio && newHeight.value) {
      const [w, h] = aspectRatio.split('/').map(Number);
      const newWidthValue = (Number(newHeight.value) * w / h).toString();
      setWidth({ ...width, value: newWidthValue });
    }
  };

  const SizeInput = ({ 
    value, 
    onChange, 
    label,
    icon
  }: { 
    value: SizeValue, 
    onChange: (value: SizeValue) => void,
    label: string,
    icon?: React.ReactNode
  }) => (
    <div className="space-y-0.5">
      <label className="text-[9px] text-gray-500 dark:text-gray-400 flex items-center gap-0.5">
        {icon}
        {label}
      </label>
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={value.value}
          onChange={(e) => onChange({ ...value, value: e.target.value })}
          className="w-[52px] px-1.5 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
          placeholder="auto"
        />
        <select
          value={value.unit}
          onChange={(e) => onChange({ ...value, unit: e.target.value })}
          className="w-12 px-1 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
        >
          {units.map(unit => (
            <option key={unit} value={unit}>{unit}</option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      {/* Main dimensions */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Dimensions</h3>
          <button
            onClick={() => {
              setWidth({ value: '', unit: 'px' });
              setHeight({ value: '', unit: 'px' });
            }}
            className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Reset dimensions"
          >
            <RefreshCw size={10} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <SizeInput
            value={width}
            onChange={handleWidthChange}
            label="Width"
            icon={<ArrowRight size={9} />}
          />
          <SizeInput
            value={height}
            onChange={handleHeightChange}
            label="Height"
            icon={<ArrowDown size={9} />}
          />
        </div>
      </div>

      {/* Aspect Ratio */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-medium text-gray-700 dark:text-gray-300">{t('aspectRatio')}</h3>
          <button
            onClick={() => setAspectRatioLocked(!aspectRatioLocked)}
            className={`p-0.5 rounded ${
              aspectRatioLocked 
                ? 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20' 
                : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title={aspectRatioLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
          >
            {aspectRatioLocked ? <Lock size={10} /> : <Unlock size={10} />}
          </button>
        </div>
        <select
          value={aspectRatio}
          onChange={(e) => setAspectRatio(e.target.value)}
          className="w-full px-1.5 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
          disabled={!aspectRatioLocked}
        >
          <option value="">{t('custom')}</option>
          {commonAspectRatios.map(ratio => (
            <option key={ratio.value} value={ratio.value}>{ratio.label}</option>
          ))}
        </select>
      </div>

      {/* Overflow */}
      <div className="space-y-1.5">
        <h3 className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Overflow</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-0.5">
            <label className="text-[9px] text-gray-500 dark:text-gray-400">Horizontal</label>
            <select
              value={overflowX}
              onChange={(e) => setOverflowX(e.target.value)}
              className="w-full px-1.5 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
            >
              {overflowOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-0.5">
            <label className="text-[9px] text-gray-500 dark:text-gray-400">Vertical</label>
            <select
              value={overflowY}
              onChange={(e) => setOverflowY(e.target.value)}
              className="w-full px-1.5 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
            >
              {overflowOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Min/Max Constraints */}
      <div className="space-y-1.5">
        <h3 className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Constraints</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <SizeInput
              value={minWidth}
              onChange={setMinWidth}
              label="Min Width"
            />
            <SizeInput
              value={maxWidth}
              onChange={setMaxWidth}
              label="Max Width"
            />
          </div>
          <div className="space-y-1.5">
            <SizeInput
              value={minHeight}
              onChange={setMinHeight}
              label="Min Height"
            />
            <SizeInput
              value={maxHeight}
              onChange={setMaxHeight}
              label="Max Height"
            />
          </div>
        </div>
      </div>
    </div>
  );
}