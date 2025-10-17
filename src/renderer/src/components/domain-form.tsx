'use client';

import { useEffect, useState } from 'react';
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
import {
    IGRPTablePrimitive,
    IGRPTableBodyPrimitive,
    IGRPTableCellPrimitive,
    IGRPTableHeadPrimitive,
    IGRPTableHeaderPrimitive,
    IGRPTableRowPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { Plus, Trash2 } from 'lucide-react';
import { IGRPInputPrimitive } from '@igrp/igrp-framework-react-design-system';
import { useTranslation } from 'react-i18next';
import { IGRPCombobox } from '@igrp/igrp-framework-react-design-system';

interface DynamicKeyValuePair {
    id: string;
    [key: string]: string; // Permite qualquer par de chave-valor
}

interface DynamicFormProps {
    onAdd: (items: Record<string, string>[]) => void;
    fieldPairs?: {
        key: string; // ex: 'paramValue'
        label: string; // ex: 'Param Value'
        options?: { label: string; value: string }[];
        placeholder?: string;
    }[];
    defaultItems?: Record<string, string>[];
    required?: boolean;
}

export default function DynamicKeyValueForm({
    onAdd,
    fieldPairs = [
        { key: 'value', label: 'Value' },
        { key: 'label', label: 'Label' },
    ],
    defaultItems = [{}],
    required = false,
}: DynamicFormProps) {
    const { t } = useTranslation();
    const [items, setItems] = useState<DynamicKeyValuePair[]>(() => {
        return defaultItems.map((item, index) => ({
            id: Date.now().toString() + index,
            ...fieldPairs.reduce(
                (acc, pair) => {
                    acc[pair.key] = item[pair.key] || '';
                    return acc;
                },
                {} as Record<string, string>
            ),
        }));
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const addItem = () => {
        const newItem: DynamicKeyValuePair = {
            id: Date.now().toString(),
            ...fieldPairs.reduce(
                (acc, pair) => {
                    acc[pair.key] = '';
                    return acc;
                },
                {} as Record<string, string>
            ),
        };
        setItems([...items, newItem]);
    };

    const removeItem = (id: string) => {
        if (required && items.length <= 1) return;
        setItems(items.filter((item) => item.id !== id));
    };

    const updateItem = (id: string, field: string, value: string) => {
        setItems(
            items.map((item) =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );

        // Clear error when field is updated
        if (errors[id]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[id];
                return newErrors;
            });
        }
    };

    const validateItems = (): boolean => {
        if (!required) return true;

        const newErrors: Record<string, string> = {};
        let isValid = true;

        items.forEach((item) => {
            const missingFields = fieldPairs
                .filter((pair) => !item[pair.key])
                .map((pair) => pair.label);

            if (missingFields.length > 0) {
                newErrors[item.id] =
                    `${missingFields.join(', ')} ${t('areRequired')}`;
                isValid = false;
            }
        });

        setErrors(newErrors);
        return isValid;
    };

    useEffect(() => {
        if (validateItems()) {
            const validItems = items
                .filter((item) => fieldPairs.every((pair) => item[pair.key]))
                .map(({ id, ...rest }) => rest);
            onAdd(validItems);
        }
    }, [items]);

    return (
        <div className="w-full border bg-card rounded-lg space-y-6 px-2">
            <IGRPTablePrimitive>
                <IGRPTableHeaderPrimitive>
                    <IGRPTableRowPrimitive>
                        {fieldPairs.map((pair) => (
                            <IGRPTableHeadPrimitive key={pair.key}>
                                {t(pair.label)}
                            </IGRPTableHeadPrimitive>
                        ))}
                        <IGRPTableHeadPrimitive>
                            <IGRPButtonPrimitive
                                onClick={addItem}
                                size="sm"
                                variant={'ghost'}
                                className="text-igrp"
                                type="button"
                            >
                                <Plus className="h-4 w-4" />
                                <span className="sr-only">{t('addRow')}</span>
                            </IGRPButtonPrimitive>
                        </IGRPTableHeadPrimitive>
                    </IGRPTableRowPrimitive>
                </IGRPTableHeaderPrimitive>
                <IGRPTableBodyPrimitive>
                    {items.map((item) => (
                        <IGRPTableRowPrimitive key={item.id}>
                            {fieldPairs.map((pair) => (
                                <IGRPTableCellPrimitive
                                    key={`${item.id}-${pair.key}`}
                                >
                                    <div className="flex flex-col">
                                        {pair.options &&
                                        pair.options.length > 0 ? (
                                            <IGRPCombobox
                                                value={item[pair.key] || ''}
                                                onChange={(val) =>
                                                    updateItem(
                                                        item.id,
                                                        pair.key,
                                                        val as string
                                                    )
                                                }
                                                options={pair.options}
                                                placeholder={pair.placeholder}
                                            />
                                        ) : (
                                            <IGRPInputPrimitive
                                                value={item[pair.key] || ''}
                                                onChange={(e) =>
                                                    updateItem(
                                                        item.id,
                                                        pair.key,
                                                        e.target.value
                                                    )
                                                }
                                                placeholder={
                                                    pair.placeholder ??
                                                    `Enter ${pair.label}`
                                                }
                                                className={`border-0 focus-visible:ring-0 p-0 h-8 ${
                                                    errors[item.id]
                                                        ? 'border-red-500'
                                                        : ''
                                                }`}
                                                required={required}
                                            />
                                        )}
                                    </div>
                                </IGRPTableCellPrimitive>
                            ))}
                            <IGRPTableCellPrimitive>
                                <IGRPButtonPrimitive
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeItem(item.id)}
                                    aria-label="Remove row"
                                    type="button"
                                    disabled={required && items.length <= 1}
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </IGRPButtonPrimitive>
                            </IGRPTableCellPrimitive>
                        </IGRPTableRowPrimitive>
                    ))}
                </IGRPTableBodyPrimitive>
            </IGRPTablePrimitive>
            {Object.values(errors).length > 0 && (
                <div className="text-sm text-red-500 px-4 pb-2">
                    {Object.values(errors).map((error, index) => (
                        <div key={index}>{error}</div>
                    ))}
                </div>
            )}
        </div>
    );
}
