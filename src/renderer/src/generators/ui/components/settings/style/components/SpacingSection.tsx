import { useState, useEffect, useCallback } from 'react';
import { Terminal, Code2, Keyboard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    SectionProps,
    Side,
    SpacingSytle,
    SpacingType,
    StyleComponent,
    Unit,
} from '../types';

const initialState: SpacingSytle = {
    margin: {
        top: { value: '0', unit: 'px' },
        right: { value: '0', unit: 'px' },
        bottom: { value: '0', unit: 'px' },
        left: { value: '0', unit: 'px' },
    },
    padding: {
        top: { value: '0', unit: 'px' },
        right: { value: '0', unit: 'px' },
        bottom: { value: '0', unit: 'px' },
        left: { value: '0', unit: 'px' },
    },
};

export function SpacingSection({ onChangeStyles, styles }: SectionProps) {
    const [spacing, setSpacing] = useState<SpacingSytle>(
        styles.spacing || initialState
    );
    const [activeType, setActiveType] = useState<SpacingType>('margin');
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [lastCommand, setLastCommand] = useState('');
    const { t } = useTranslation();

    useEffect(() => {
        onChangeStyles({ spacing: spacing });
    }, [spacing]);

    const handleKeyCommand = useCallback(
        (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey) {
                const value = { value: '16', unit: 'px' as Unit };

                switch (e.key) {
                    case 'm':
                        e.preventDefault();
                        setActiveType('margin');
                        setLastCommand('Switched to margin');
                        break;
                    case 'p':
                        e.preventDefault();
                        setActiveType('padding');
                        setLastCommand('Switched to padding');
                        break;
                    case '1':
                        e.preventDefault();
                        setSpacing((prev) => ({
                            ...prev,
                            [activeType]: {
                                top: value,
                                right: value,
                                bottom: value,
                                left: value,
                            },
                        }));
                        setLastCommand(`Set all ${activeType} to 16px`);
                        break;
                    case '0':
                        e.preventDefault();
                        setSpacing((prev) => ({
                            ...prev,
                            [activeType]: initialState[activeType],
                        }));
                        setLastCommand(`Reset ${activeType}`);
                        break;
                }
            }
        },
        [activeType]
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyCommand);
        return () => window.removeEventListener('keydown', handleKeyCommand);
    }, [handleKeyCommand]);

    // Update handler for individual spacing values
    const handleSpacingChange = (
        type: SpacingType,
        side: Side,
        field: 'value' | 'unit',
        newValue: string
    ) => {
        setSpacing((prev) => ({
            ...prev,
            [type]: {
                ...prev[type],
                [side]: {
                    ...prev[type][side],
                    [field]: field === 'value' ? newValue : (newValue as Unit),
                },
            },
        }));
        setLastCommand(`Updated ${type}-${side}`);
    };

    return (
        <div className="space-y-2">
            {/* Command Bar */}
            <div className="flex items-center gap-1 bg-gray-800 dark:bg-gray-900 text-white px-1.5 py-1 rounded text-[9px]">
                <Terminal size={10} />
                <span className="font-medium tracking-wide flex-1 truncate">
                    {lastCommand || 'Ready'}
                </span>
                <button
                    onClick={() => setShowShortcuts(!showShortcuts)}
                    className="p-0.5 hover:bg-gray-700 rounded"
                >
                    <Keyboard size={10} />
                </button>
            </div>

            {/* Shortcuts Panel */}
            {showShortcuts && (
                <div className="bg-gray-100 dark:bg-gray-800 rounded p-1.5 text-[9px] space-y-1">
                    <div className="flex justify-between">
                        <span>⌘/Ctrl + M</span>
                        <span className="text-gray-500">
                            {t('switchToMargin')}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>⌘/Ctrl + P</span>
                        <span className="text-gray-500">
                            {t('switchToPadding')}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>⌘/Ctrl + 1</span>
                        <span className="text-gray-500">
                            {t('setAllTo16px')}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>⌘/Ctrl + 0</span>
                        <span className="text-gray-500">
                            {t('resetValues')}
                        </span>
                    </div>
                </div>
            )}

            {/* Type Selector */}
            <div className="flex gap-1">
                {(['margin', 'padding'] as const).map((type) => (
                    <button
                        key={type}
                        onClick={() => {
                            setActiveType(type);
                            setLastCommand(`Switched to ${type}`);
                        }}
                        className={`flex-1 px-2 py-1 rounded text-[9px] font-medium transition-colors ${
                            activeType === type
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                    >
                        {type.toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Editor Grid */}
            <div className="grid grid-cols-2 gap-2">
                {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
                    <div key={side} className="space-y-0.5">
                        <label className="text-[9px] text-gray-500 flex items-center gap-0.5">
                            <Code2 size={9} />
                            {side}
                        </label>
                        <div className="flex items-center gap-1">
                            <input
                                type="text"
                                value={spacing[activeType][side].value}
                                onChange={(e) =>
                                    handleSpacingChange(
                                        activeType,
                                        side,
                                        'value',
                                        e.target.value
                                    )
                                }
                                className="w-[52px] bg-gray-100 dark:bg-gray-800 border-0 rounded px-1.5 py-0.5 text-[9px]"
                            />
                            <select
                                value={spacing[activeType][side].unit}
                                onChange={(e) =>
                                    handleSpacingChange(
                                        activeType,
                                        side,
                                        'unit',
                                        e.target.value
                                    )
                                }
                                className="w-12 bg-gray-100 dark:bg-gray-800 border-0 rounded px-1 py-0.5 text-[9px]"
                            >
                                {['px', 'rem', '%', 'em', 'auto'].map(
                                    (unit) => (
                                        <option key={unit} value={unit}>
                                            {unit}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
