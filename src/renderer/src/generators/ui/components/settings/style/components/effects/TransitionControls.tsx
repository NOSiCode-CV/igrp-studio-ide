import { useState, useRef, useEffect } from 'react';
import { Timer, Plus, Trash2, Edit2 } from 'lucide-react';
import { TransitionValue, transitionProperties, timingFunctions } from './types';
import { useTranslation } from 'react-i18next';

interface TransitionControlsProps {
  transitions: TransitionValue[];
  onTransitionsChange: (transitions: TransitionValue[]) => void;
}

export function TransitionControls({
  transitions,
  onTransitionsChange
}: TransitionControlsProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<'top' | 'bottom'>('bottom');
  const [previewActive, setPreviewActive] = useState<number | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setEditingIndex(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function updatePopoverPosition() {
      if (!buttonRef.current || !popoverRef.current || !containerRef.current) return;

      const buttonRect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;

      const newPosition = spaceBelow >= 200 || spaceBelow > spaceAbove ? 'bottom' : 'top';
      setPopoverPosition(newPosition);
    }

    if (editingIndex !== null) {
      updatePopoverPosition();
    }
  }, [editingIndex]);

  const addTransition = () => {
    onTransitionsChange([...transitions, {
      property: 'all',
      duration: '300',
      timing: 'ease',
      delay: '0'
    }]);
  };

  const removeTransition = (index: number) => {
    onTransitionsChange(transitions.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };
  
  const { t } = useTranslation();
  const updateTransition = (index: number, field: keyof TransitionValue, value: string) => {
    const newTransitions = [...transitions];
    newTransitions[index] = { ...newTransitions[index], [field]: value };
    onTransitionsChange(newTransitions);
  };

  const getTransitionPreview = (transition: TransitionValue) => {
    return `${transition.property} ${transition.duration}ms ${transition.timing} ${transition.delay}ms`;
  };

  const TransitionEditor = ({ transition, index }: { transition: TransitionValue; index: number }) => (
    <div 
      ref={popoverRef}
      className={`absolute z-50 right-0 w-56 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ${
        popoverPosition === 'bottom' ? 'top-full mt-1' : 'bottom-full mb-1'
      }`}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between pb-1 border-b border-gray-200 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('editTransition')} {index + 1}
          </span>
          <button
            onClick={() => removeTransition(index)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <Trash2 size={10} />
          </button>
        </div>

        <div className="space-y-0.5">
          <label className="text-xs text-gray-500">Property</label>
          <select
            value={transition.property}
            onChange={(e) => updateTransition(index, 'property', e.target.value)}
            className="w-full px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
          >
            {transitionProperties.map(prop => (
              <option key={prop} value={prop}>{prop}</option>
            ))}
          </select>
        </div>

        <div className="space-y-0.5">
          <label className="text-xs text-gray-500">Duration</label>
          <div className="flex items-center gap-1">
            <input
              type="range"
              min="0"
              max="2000"
              step="50"
              value={transition.duration}
              onChange={(e) => updateTransition(index, 'duration', e.target.value)}
              className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                value={transition.duration}
                onChange={(e) => updateTransition(index, 'duration', e.target.value)}
                className="w-14 px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-500">ms</span>
            </div>
          </div>
        </div>

        <div className="space-y-0.5">
          <label className="text-xs text-gray-500">Timing Function</label>
          <select
            value={transition.timing}
            onChange={(e) => updateTransition(index, 'timing', e.target.value)}
            className="w-full px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
          >
            {timingFunctions.map(timing => (
              <option key={timing} value={timing}>{timing}</option>
            ))}
          </select>
        </div>

        <div className="space-y-0.5">
          <label className="text-xs text-gray-500">Delay</label>
          <div className="flex items-center gap-1">
            <input
              type="range"
              min="0"
              max="1000"
              step="50"
              value={transition.delay}
              onChange={(e) => updateTransition(index, 'delay', e.target.value)}
              className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                value={transition.delay}
                onChange={(e) => updateTransition(index, 'delay', e.target.value)}
                className="w-14 px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-500">ms</span>
            </div>
          </div>
        </div>

        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded">
          <div className="text-xs text-gray-500 mb-1">Preview</div>
          <div className="relative w-full h-12">
            <div 
              className="absolute inset-0 m-auto w-8 h-8 bg-blue-500 rounded cursor-pointer"
              style={{ 
                transition: getTransitionPreview(transition),
                transform: previewActive === index ? 'scale(1.5) rotate(180deg)' : 'scale(1) rotate(0deg)',
                opacity: previewActive === index ? '0.5' : '1'
              }}
              onMouseEnter={() => setPreviewActive(index)}
              onMouseLeave={() => setPreviewActive(null)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
          <Timer size={10} />
          Transitions
        </h3>
        <button
          onClick={addTransition}
          className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="Add transition"
        >
          <Plus size={10} />
        </button>
      </div>

      <div className="space-y-1">
        {transitions.map((transition, index) => (
          <div 
            key={index}
            className="group flex items-center gap-2 p-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800 rounded transition-colors"
          >
            <div 
              className="relative w-6 h-6 cursor-pointer"
              onMouseEnter={() => setPreviewActive(index)}
              onMouseLeave={() => setPreviewActive(null)}
            >
              <div 
                className="absolute inset-0 m-auto w-3 h-3 bg-blue-500 rounded"
                style={{ 
                  transition: getTransitionPreview(transition),
                  transform: previewActive === index ? 'scale(1.5) rotate(180deg)' : 'scale(1) rotate(0deg)',
                  opacity: previewActive === index ? '0.5' : '1'
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {transition.property.charAt(0).toUpperCase() + transition.property.slice(1)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {getTransitionPreview(transition)}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <div className="relative">
                <button
                  ref={buttonRef}
                  onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  <Edit2 size={10} />
                </button>
                {editingIndex === index && <TransitionEditor transition={transition} index={index} />}
              </div>
              <button
                onClick={() => removeTransition(index)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <Trash2 size={10} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}