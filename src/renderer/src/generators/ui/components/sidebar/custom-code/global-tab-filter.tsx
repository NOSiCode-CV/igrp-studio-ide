import { useState } from 'react';
import { IGRPInputText } from '@igrp/igrp-framework-react-design-system';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import { Search, X } from 'lucide-react';
import { cn } from '@renderer/lib/utils';

interface GlobalTabFilterProps {
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    onClear?: () => void;
    className?: string;
    showClearButton?: boolean;
    activeTab?: string;
}

export const GlobalTabFilter = ({
    placeholder = "Search across all tabs...",
    value,
    onChange,
    onClear,
    className,
    showClearButton = true,
}: GlobalTabFilterProps) => {
    const handleClear = () => {
        onChange('');
        onClear?.();
    };

    return (
        <div className={cn("space-y-2 border-b pb-3", className)}>
            <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <IGRPInputText
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="pl-8 pr-8"
                />
                {showClearButton && value && (
                    <IGRPButtonPrimitive
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    >
                        <X className="h-3 w-3" />
                    </IGRPButtonPrimitive>
                )}
            </div>
        </div>
    );
};

// Hook for managing global filter state
export const useGlobalTabFilter = (initialValue = '') => {
    const [filterValue, setFilterValue] = useState(initialValue);

    const clearFilter = () => setFilterValue('');

    return {
        filterValue,
        setFilterValue,
        clearFilter,
    };
}; 