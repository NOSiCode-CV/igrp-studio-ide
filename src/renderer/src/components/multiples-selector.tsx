'use client';

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { IGRPBadge } from '@igrp/igrp-framework-react-design-system';
import {
    IGRPCommandPrimitive,
    IGRPCommandEmptyPrimitive,
    IGRPCommandGroupPrimitive,
    IGRPCommandInputPrimitive,
    IGRPCommandItemPrimitive,
    IGRPPopoverTriggerPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import {
    IGRPPopoverPrimitive,
    IGRPPopoverContentPrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { cn } from '@renderer/lib/utils';
import { IGRPScrollAreaPrimitive } from '@igrp/igrp-framework-react-design-system';

type Option = {
    value: string;
    label: string;
};

type MultiSelectProps = {
    options: Option[];
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
};

export default function MultipleSelector({
    options,
    value,
    onChange,
    placeholder = 'Select items...',
}: MultiSelectProps) {
    const [open, setOpen] = React.useState(false);

    const { t } = useTranslation();

    const handleUnselect = (item: string) => {
        onChange(value.filter((i) => i !== item));
    };

    return (
        <IGRPPopoverPrimitive open={open} onOpenChange={setOpen}>
            <IGRPPopoverTriggerPrimitive asChild>
                <div className="flex min-h-[40px] w-full flex-wrap items-center justify-start rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    {value && value.length > 0 ? (
                        value.map((item) => (
                            <IGRPBadge
                                key={item}
                                variant="soft"
                                className="mr-1 mb-1"
                            >
                                {options &&
                                    options.find(
                                        (option) => option.value === item
                                    )?.label}
                                <button
                                    className="ml-1 ring-offset-background rounded-full outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleUnselect(item);
                                        }
                                    }}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    onClick={() => handleUnselect(item)}
                                >
                                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                </button>
                            </IGRPBadge>
                        ))
                    ) : (
                        <span className="text-muted-foreground">
                            {placeholder}
                        </span>
                    )}
                </div>
            </IGRPPopoverTriggerPrimitive>
            <IGRPPopoverContentPrimitive className="w-[200px] p-0 min-w-50">
                <IGRPScrollAreaPrimitive>
                    <div className="max-h-[60svh]">
                        <IGRPCommandPrimitive>
                            <IGRPCommandInputPrimitive
                                placeholder={placeholder}
                            />
                            <IGRPCommandEmptyPrimitive>
                                {t('noItemFound')}
                            </IGRPCommandEmptyPrimitive>
                            <IGRPCommandGroupPrimitive>
                                {options &&
                                    options.map((option) => (
                                        <IGRPCommandItemPrimitive
                                            key={option.value}
                                            onSelect={() => {
                                                onChange(
                                                    value
                                                        ? value.includes(
                                                              option.value
                                                          )
                                                            ? value.filter(
                                                                  (item) =>
                                                                      item !==
                                                                      option.value
                                                              )
                                                            : [
                                                                  ...value,
                                                                  option.value,
                                                              ]
                                                        : []
                                                );
                                                setOpen(true);
                                            }}
                                        >
                                            <div
                                                className={cn(
                                                    `mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary`,
                                                    value &&
                                                        value.includes(
                                                            option.value
                                                        )
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'opacity-50'
                                                )}
                                            >
                                                {value &&
                                                    value.includes(
                                                        option.value
                                                    ) && (
                                                        <X className="h-3 w-3" />
                                                    )}
                                            </div>
                                            {option.label}
                                        </IGRPCommandItemPrimitive>
                                    ))}
                            </IGRPCommandGroupPrimitive>
                        </IGRPCommandPrimitive>
                    </div>
                </IGRPScrollAreaPrimitive>
            </IGRPPopoverContentPrimitive>
        </IGRPPopoverPrimitive>
    );
}
