import React, { useState } from 'react';
import { Type, AlignLeft, AlignCenter, AlignRight, AlignJustify, RefreshCw } from 'lucide-react';

interface TypographyValue {
  value: string;
  unit: string;
}

export function TypographySection() {
  const [fontSize, setFontSize] = useState<TypographyValue>({ value: '16', unit: 'px' });
  const [lineHeight, setLineHeight] = useState<TypographyValue>({ value: '1.5', unit: 'em' });
  const [letterSpacing, setLetterSpacing] = useState<TypographyValue>({ value: '0', unit: 'px' });
  const [wordSpacing, setWordSpacing] = useState<TypographyValue>({ value: '0', unit: 'px' });
  const [textAlign, setTextAlign] = useState('left');
  const [fontWeight, setFontWeight] = useState('400');
  const [fontStyle, setFontStyle] = useState('normal');
  const [textDecoration, setTextDecoration] = useState('none');
  const [textTransform, setTextTransform] = useState('none');

  const units = {
    fontSize: ['px', 'rem', 'em', '%'],
    lineHeight: ['em', 'px', '%', 'normal'],
    spacing: ['px', 'em', 'rem']
  };

  const fontWeights = [
    { value: '100', label: 'Thin' },
    { value: '200', label: 'Extra Light' },
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi Bold' },
    { value: '700', label: 'Bold' },
    { value: '800', label: 'Extra Bold' },
    { value: '900', label: 'Black' }
  ];

  const fontFamilies = [
    { value: 'Inter', label: 'Inter' },
    { value: 'system-ui', label: 'System UI' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Open Sans', label: 'Open Sans' },
    { value: 'Helvetica', label: 'Helvetica' },
    { value: 'Arial', label: 'Arial' },
    { value: 'monospace', label: 'Monospace' }
  ];

  const SizeInput = ({ 
    value,
    onChange,
    label,
    availableUnits,
    icon
  }: { 
    value: TypographyValue,
    onChange: (value: TypographyValue) => void,
    label: string,
    availableUnits: string[],
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
        />
        <select
          value={value.unit}
          onChange={(e) => onChange({ ...value, unit: e.target.value })}
          className="w-12 px-1 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
        >
          {availableUnits.map(unit => (
            <option key={unit} value={unit}>{unit}</option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      {/* Font Family and Weight */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Font</h3>
          <button
            onClick={() => {
              setFontSize({ value: '16', unit: 'px' });
              setLineHeight({ value: '1.5', unit: 'em' });
              setLetterSpacing({ value: '0', unit: 'px' });
              setWordSpacing({ value: '0', unit: 'px' });
            }}
            className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Reset typography"
          >
            <RefreshCw size={10} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-0.5">
            <label className="text-[9px] text-gray-500 dark:text-gray-400">Family</label>
            <select
              className="w-full px-1.5 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
            >
              {fontFamilies.map(font => (
                <option key={font.value} value={font.value}>{font.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-0.5">
            <label className="text-[9px] text-gray-500 dark:text-gray-400">Weight</label>
            <select
              value={fontWeight}
              onChange={(e) => setFontWeight(e.target.value)}
              className="w-full px-1.5 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
            >
              {fontWeights.map(weight => (
                <option key={weight.value} value={weight.value}>{weight.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Size and Line Height */}
      <div className="space-y-1.5">
        <h3 className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Size & Height</h3>
        <div className="grid grid-cols-2 gap-2">
          <SizeInput
            value={fontSize}
            onChange={setFontSize}
            label="Font Size"
            availableUnits={units.fontSize}
            icon={<Type size={9} />}
          />
          <SizeInput
            value={lineHeight}
            onChange={setLineHeight}
            label="Line Height"
            availableUnits={units.lineHeight}
          />
        </div>
      </div>

      {/* Spacing */}
      <div className="space-y-1.5">
        <h3 className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Spacing</h3>
        <div className="grid grid-cols-2 gap-2">
          <SizeInput
            value={letterSpacing}
            onChange={setLetterSpacing}
            label="Letter"
            availableUnits={units.spacing}
          />
          <SizeInput
            value={wordSpacing}
            onChange={setWordSpacing}
            label="Word"
            availableUnits={units.spacing}
          />
        </div>
      </div>

      {/* Text Alignment */}
      <div className="space-y-1.5">
        <h3 className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Alignment</h3>
        <div className="grid grid-cols-4 gap-0.5">
          {[
            { value: 'left', icon: <AlignLeft size={12} /> },
            { value: 'center', icon: <AlignCenter size={12} /> },
            { value: 'right', icon: <AlignRight size={12} /> },
            { value: 'justify', icon: <AlignJustify size={12} /> }
          ].map((align) => (
            <button
              key={align.value}
              onClick={() => setTextAlign(align.value)}
              className={`p-1.5 rounded ${
                textAlign === align.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {align.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Style and Decoration */}
      <div className="space-y-1.5">
        <h3 className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Style</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-0.5">
            <label className="text-[9px] text-gray-500 dark:text-gray-400">Font Style</label>
            <select
              value={fontStyle}
              onChange={(e) => setFontStyle(e.target.value)}
              className="w-full px-1.5 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
            >
              <option value="normal">Normal</option>
              <option value="italic">Italic</option>
              <option value="oblique">Oblique</option>
            </select>
          </div>
          <div className="space-y-0.5">
            <label className="text-[9px] text-gray-500 dark:text-gray-400">Decoration</label>
            <select
              value={textDecoration}
              onChange={(e) => setTextDecoration(e.target.value)}
              className="w-full px-1.5 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
            >
              <option value="none">None</option>
              <option value="underline">Underline</option>
              <option value="line-through">Line Through</option>
              <option value="overline">Overline</option>
            </select>
          </div>
        </div>
      </div>

      {/* Text Transform */}
      <div className="space-y-1.5">
        <h3 className="text-[10px] font-medium text-gray-700 dark:text-gray-300">Transform</h3>
        <select
          value={textTransform}
          onChange={(e) => setTextTransform(e.target.value)}
          className="w-full px-1.5 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
        >
          <option value="none">None</option>
          <option value="uppercase">Uppercase</option>
          <option value="lowercase">Lowercase</option>
          <option value="capitalize">Capitalize</option>
        </select>
      </div>
    </div>
  );
}