import { useState, useRef, useEffect } from 'react';
import { Filter, Plus, Trash2, Edit2 } from 'lucide-react';
import { FilterValue, filterTypes } from './types';

interface FilterControlsProps {
  title: string;
  filters: FilterValue[];
  onFiltersChange: (filters: FilterValue[]) => void;
}

export function FilterControls({
  title,
  filters,
  onFiltersChange
}: FilterControlsProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [popoverPosition, setPopoverPosition] = useState<'top' | 'bottom'>('bottom');
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

  const addFilter = () => {
    onFiltersChange([...filters, { type: 'blur', value: '0', unit: 'px' }]);
  };

  const removeFilter = (index: number) => {
    onFiltersChange(filters.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const updateFilter = (index: number, field: keyof FilterValue, value: string) => {
    const newFilters = [...filters];
    const filterType = filterTypes.find(t => t.name === (field === 'type' ? value : newFilters[index].type));
    
    if (field === 'type') {
      newFilters[index] = {
        type: value,
        value: filterType?.min || '0',
        unit: filterType?.unit || 'px'
      };
    } else {
      newFilters[index] = { ...newFilters[index], [field]: value };
    }
    
    onFiltersChange(newFilters);
  };

  const getFilterPreview = (filter: FilterValue) => {
    return `${filter.type}(${filter.value}${filter.unit})`;
  };

  const FilterEditor = ({ filter, index }: { filter: FilterValue; index: number }) => {
    const filterType = filterTypes.find(t => t.name === filter.type);

    return (
      <div 
        ref={popoverRef}
        className={`absolute z-50 right-0 w-56 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 ${
          popoverPosition === 'bottom' ? 'top-full mt-1' : 'bottom-full mb-1'
        }`}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-gray-200 dark:border-gray-700">
            <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">
              Edit Filter {index + 1}
            </span>
            <button
              onClick={() => removeFilter(index)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <Trash2 size={10} />
            </button>
          </div>

          <div className="space-y-0.5">
            <label className="text-[9px] text-gray-500">Type</label>
            <select
              value={filter.type}
              onChange={(e) => updateFilter(index, 'type', e.target.value)}
              className="w-full px-1.5 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
            >
              {filterTypes.map(type => (
                <option key={type.name} value={type.name}>
                  {type.name.charAt(0).toUpperCase() + type.name.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-0.5">
            <label className="text-[9px] text-gray-500">Value</label>
            <div className="flex items-center gap-1">
              <input
                type="range"
                min={filterType?.min}
                max={filterType?.max}
                value={filter.value}
                onChange={(e) => updateFilter(index, 'value', e.target.value)}
                className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={filterType?.min}
                  max={filterType?.max}
                  value={filter.value}
                  onChange={(e) => updateFilter(index, 'value', e.target.value)}
                  className="w-12 px-1.5 py-0.5 text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[9px] text-gray-500">{filterType?.unit}</span>
              </div>
            </div>
          </div>

          <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded">
            <div className="text-[9px] text-gray-500 mb-1">Preview</div>
            <div 
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded"
              style={{ filter: getFilterPreview(filter) }}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
          <Filter size={10} />
          {title}
        </h3>
        <button
          onClick={addFilter}
          className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          title="Add filter"
        >
          <Plus size={10} />
        </button>
      </div>

      <div className="space-y-1">
        {filters.map((filter, index) => (
          <div 
            key={index}
            className="group flex items-center gap-2 p-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800 rounded transition-colors"
          >
            <div 
              className="w-6 h-6 rounded bg-gradient-to-r from-blue-500 to-purple-500"
              style={{ filter: getFilterPreview(filter) }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[9px] font-medium text-gray-700 dark:text-gray-300">
                {filter.type.charAt(0).toUpperCase() + filter.type.slice(1)} Filter
              </div>
              <div className="text-[8px] text-gray-500 dark:text-gray-400 truncate">
                {getFilterPreview(filter)}
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
                {editingIndex === index && <FilterEditor filter={filter} index={index} />}
              </div>
              <button
                onClick={() => removeFilter(index)}
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