import React, { useState, useEffect } from 'react';
import {
    Type,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    RefreshCw,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SectionProps, TypographyStyle, TypographyValue } from '../types';

export function TypographySection({ onChangeStyles, styles }: SectionProps) {
    const [typographyStyle, setTypographyStyle] = useState<TypographyStyle>(
        styles.typography || {
            fontSize: { value: '16', unit: 'px' },
            lineHeight: { value: '1.5', unit: 'em' },
            letterSpacing: { value: '0', unit: 'px' },
            wordSpacing: { value: '0', unit: 'px' },
            textAlign: 'left',
            fontWeight: '400',
            fontStyle: 'normal',
            textDecoration: 'none',
            textTransform: 'none',
            fontFamily: 'Inter',
        }
    );

    const updateTypographyStyle = (updates: Partial<TypographyStyle>) => {
        setTypographyStyle((prev) => ({
            ...prev,
            ...updates,
            fontSize: updates.fontSize || prev.fontSize,
            lineHeight: updates.lineHeight || prev.lineHeight,
            letterSpacing: updates.letterSpacing || prev.letterSpacing,
            wordSpacing: updates.wordSpacing || prev.wordSpacing,
        }));
    };

    const resetTypography = () => {
        updateTypographyStyle({
            fontSize: { value: '16', unit: 'px' },
            lineHeight: { value: '1.5', unit: 'em' },
            letterSpacing: { value: '0', unit: 'px' },
            wordSpacing: { value: '0', unit: 'px' },
            textAlign: 'left',
            fontWeight: '400',
            fontStyle: 'normal',
            textDecoration: 'none',
            textTransform: 'none',
            fontFamily: 'Inter',
        });
    };

    useEffect(() => {
        onChangeStyles({ typography: typographyStyle });
    }, [typographyStyle]);

    const units = {
        fontSize: ['px', 'rem', 'em', '%'],
        lineHeight: ['em', 'px', '%', 'normal'],
        spacing: ['px', 'em', 'rem'],
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
        { value: '900', label: 'Black' },
    ];

    const fontFamilies = [
        { value: 'Inter', label: 'Inter' },
        { value: 'system-ui', label: 'System UI' },
        { value: 'Roboto', label: 'Roboto' },
        { value: 'Open Sans', label: 'Open Sans' },
        { value: 'Helvetica', label: 'Helvetica' },
        { value: 'Arial', label: 'Arial' },
        { value: 'monospace', label: 'Monospace' },
    ];

    const { t } = useTranslation();

    const SizeInput = ({
        value,
        onChange,
        label,
        availableUnits,
        icon,
    }: {
        value: TypographyValue;
        onChange: (value: TypographyValue) => void;
        label: string;
        availableUnits: string[];
        icon?: React.ReactNode;
    }) => (
        <div className="space-y-0.5">
            <label className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-0.5">
                {icon}
                {label}
            </label>
            <div className="flex items-center gap-1">
                <input
                    type="text"
                    value={value.value}
                    onChange={(e) =>
                        onChange({ ...value, value: e.target.value })
                    }
                    className="w-[52px] px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                />
                <select
                    value={value.unit}
                    onChange={(e) =>
                        onChange({ ...value, unit: e.target.value })
                    }
                    className="w-12 px-1 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                >
                    {availableUnits.map((unit) => (
                        <option key={unit} value={unit}>
                            {unit}
                        </option>
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
                    <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Font
                    </h3>
                    <button
                        onClick={resetTypography}
                        className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title="Reset typography"
                    >
                        <RefreshCw size={10} />
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-0.5">
                        <label className="text-xs text-gray-500 dark:text-gray-400">
                            {t('family')}
                        </label>
                        <select
                            value={typographyStyle.fontFamily}
                            onChange={(e) =>
                                updateTypographyStyle({
                                    fontFamily: e.target.value,
                                })
                            }
                            className="w-full px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                        >
                            {fontFamilies.map((font) => (
                                <option key={font.value} value={font.value}>
                                    {font.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-0.5">
                        <label className="text-xs text-gray-500 dark:text-gray-400">
                            {t('weight')}
                        </label>
                        <select
                            value={typographyStyle.fontWeight}
                            onChange={(e) =>
                                updateTypographyStyle({
                                    fontWeight: e.target.value,
                                })
                            }
                            className="w-full px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                        >
                            {fontWeights.map((weight) => (
                                <option key={weight.value} value={weight.value}>
                                    {weight.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Size and Line Height */}
            <div className="space-y-1.5">
                <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {t('sizeHeight')}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    <SizeInput
                        value={typographyStyle.fontSize}
                        onChange={(value) =>
                            updateTypographyStyle({ fontSize: value })
                        }
                        label="Font Size"
                        availableUnits={units.fontSize}
                        icon={<Type size={9} />}
                    />
                    <SizeInput
                        value={typographyStyle.lineHeight}
                        onChange={(value) =>
                            updateTypographyStyle({ lineHeight: value })
                        }
                        label="Line Height"
                        availableUnits={units.lineHeight}
                    />
                </div>
            </div>

            {/* Spacing */}
            <div className="space-y-1.5">
                <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {t('spacing')}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    <SizeInput
                        value={typographyStyle.letterSpacing}
                        onChange={(value) =>
                            updateTypographyStyle({ letterSpacing: value })
                        }
                        label="Letter"
                        availableUnits={units.spacing}
                    />
                    <SizeInput
                        value={typographyStyle.wordSpacing}
                        onChange={(value) =>
                            updateTypographyStyle({ wordSpacing: value })
                        }
                        label="Word"
                        availableUnits={units.spacing}
                    />
                </div>
            </div>

            {/* Text Alignment */}
            <div className="space-y-1.5">
                <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {t('alignment')}
                </h3>
                <div className="grid grid-cols-4 gap-0.5">
                    {[
                        { value: 'left', icon: <AlignLeft size={12} /> },
                        { value: 'center', icon: <AlignCenter size={12} /> },
                        { value: 'right', icon: <AlignRight size={12} /> },
                        { value: 'justify', icon: <AlignJustify size={12} /> },
                    ].map((align) => (
                        <button
                            key={align.value}
                            onClick={() =>
                                updateTypographyStyle({
                                    textAlign: align.value,
                                })
                            }
                            className={`p-1.5 rounded ${
                                typographyStyle.textAlign === align.value
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
                <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {t('style')}
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-0.5">
                        <label className="text-xs text-gray-500 dark:text-gray-400">
                            {t('fontStyle')}
                        </label>
                        <select
                            value={typographyStyle.fontStyle}
                            onChange={(e) =>
                                updateTypographyStyle({
                                    fontStyle: e.target.value,
                                })
                            }
                            className="w-full px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="normal">{t('normal')}</option>
                            <option value="italic">{t('italic')}</option>
                            <option value="oblique">{t('oblique')}</option>
                        </select>
                    </div>
                    <div className="space-y-0.5">
                        <label className="text-xs text-gray-500 dark:text-gray-400">
                            Decoration
                        </label>
                        <select
                            value={typographyStyle.textDecoration}
                            onChange={(e) =>
                                updateTypographyStyle({
                                    textDecoration: e.target.value,
                                })
                            }
                            className="w-full px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="none">{t('none')}</option>
                            <option value="underline">{t('underline')}</option>
                            <option value="line-through">
                                {t('lineThrough')}
                            </option>
                            <option value="overline">{t('overline')}</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Text Transform */}
            <div className="space-y-1.5">
                <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Transform
                </h3>
                <select
                    value={typographyStyle.textTransform}
                    onChange={(e) =>
                        updateTypographyStyle({ textTransform: e.target.value })
                    }
                    className="w-full px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-blue-500"
                >
                    <option value="none">{t('none')}</option>
                    <option value="uppercase">{t('uppercase')}</option>
                    <option value="lowercase">{t('lowercase')}</option>
                    <option value="capitalize">{t('capitalize')}</option>
                </select>
            </div>
        </div>
    );
}
