import {
    IGRPButtonPrimitive,
    IGRPDropdownMenuContentPrimitive,
    IGRPDropdownMenuItemPrimitive,
    IGRPDropdownMenuPrimitive,
    IGRPDropdownMenuSubContentPrimitive,
    IGRPDropdownMenuSubPrimitive,
    IGRPDropdownMenuSubTriggerPrimitive,
    IGRPDropdownMenuTriggerPrimitive,
    IGRPScrollAreaPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { isSharedModuleName } from '@renderer/constants/appConstants'
import { cn } from '@renderer/lib/utils'
import { getLabel } from '@renderer/utils'
import React from 'react'
import type { SchemaTypeItem } from 'src/main/types'

interface TypeSelectorDropdownProps {
    type: string
    onTypeChange: (type: string | any) => void
    schemaTypes?: SchemaTypeItem[]
    className?: string
    variant?:
        | 'default'
        | 'destructive'
        | 'outline'
        | 'secondary'
        | 'ghost'
        | 'link'
        | null
        | undefined
    children?: React.ReactNode
}

export const TypeSelectorDropdown: React.FC<TypeSelectorDropdownProps> = ({
    type,
    onTypeChange,
    schemaTypes,
    className,
    variant = 'ghost',
    children
}) => {
    const renderIcon = (item: SchemaTypeItem) => {
        const { module } = item
        if (module) {
            return (
                <div className="flex items-center justify-center w-4 h-4 rounded bg-primary/25 text-igrp">
                    {isSharedModuleName(module) ? 'C' : module.charAt(0).toUpperCase()}
                </div>
            )
        }
        return null
    }
    return (
        <IGRPDropdownMenuPrimitive>
            <IGRPDropdownMenuTriggerPrimitive asChild>
                <IGRPButtonPrimitive
                    variant={variant}
                    className={cn('h-6 px-2 text-sm', className)}
                >
                    <span className="flex flex-1">{type || 'Set Type'}</span>
                    {children}
                </IGRPButtonPrimitive>
            </IGRPDropdownMenuTriggerPrimitive>
            <IGRPDropdownMenuContentPrimitive className="w-60">
                {schemaTypes &&
                    schemaTypes.map(({ label, value, module, items }) => {
                        return (
                            <React.Fragment key={value}>
                                {items && typeof items === 'object' && !Array.isArray(items) ? (
                                    // When items is an object (like your example)
                                    <IGRPDropdownMenuSubPrimitive>
                                        <IGRPDropdownMenuSubTriggerPrimitive>
                                            {label}
                                        </IGRPDropdownMenuSubTriggerPrimitive>
                                        <IGRPDropdownMenuSubContentPrimitive className="min-w-50">
                                            <IGRPScrollAreaPrimitive>
                                                <div className="max-h-[60svh]">
                                                    {Object.entries(items).map(
                                                        ([category, subItems]) => (
                                                            <React.Fragment key={category}>
                                                                <IGRPDropdownMenuItemPrimitive
                                                                    disabled
                                                                >
                                                                    {getLabel(category)}
                                                                </IGRPDropdownMenuItemPrimitive>
                                                                {(subItems as string[]).map(
                                                                    (subItemValue, key) => (
                                                                        <IGRPDropdownMenuItemPrimitive
                                                                            key={key}
                                                                            onClick={() =>
                                                                                onTypeChange({
                                                                                    type: value,
                                                                                    value: subItemValue
                                                                                } as any)
                                                                            }
                                                                        >
                                                                            {getLabel(subItemValue)}
                                                                        </IGRPDropdownMenuItemPrimitive>
                                                                    )
                                                                )}
                                                            </React.Fragment>
                                                        )
                                                    )}
                                                </div>
                                            </IGRPScrollAreaPrimitive>
                                        </IGRPDropdownMenuSubContentPrimitive>
                                    </IGRPDropdownMenuSubPrimitive>
                                ) : items && Array.isArray(items) && items.length > 0 ? (
                                    // When items is an array. Items may be
                                    // `{label, value, module?}` objects (the
                                    // Spring/legacy shape) OR raw strings
                                    // (what the .NET engine returns directly
                                    // from `ATTRIBUTE_TYPES`). Normalise per
                                    // entry so the dropdown renders text and
                                    // dispatches the correct value regardless
                                    // of which engine produced the list.
                                    <IGRPDropdownMenuSubPrimitive>
                                        <IGRPDropdownMenuSubTriggerPrimitive>
                                            {label}
                                        </IGRPDropdownMenuSubTriggerPrimitive>
                                        <IGRPDropdownMenuSubContentPrimitive className="min-w-50">
                                            <IGRPScrollAreaPrimitive>
                                                <div className="max-h-[60svh]">
                                                    {items.map((subItem, key) => {
                                                        const isString = typeof subItem === 'string'
                                                        const subItemValue = isString
                                                            ? subItem
                                                            : subItem.value
                                                        const subItemLabel = isString
                                                            ? subItem
                                                            : subItem.label
                                                        const subItemModule = isString
                                                            ? undefined
                                                            : subItem.module
                                                        return (
                                                            <IGRPDropdownMenuItemPrimitive
                                                                key={key}
                                                                onClick={() =>
                                                                    onTypeChange({
                                                                        type: value,
                                                                        value: subItemValue,
                                                                        module: subItemModule
                                                                    } as any)
                                                                }
                                                            >
                                                                {!isString && renderIcon(subItem)}
                                                                {subItemLabel}
                                                            </IGRPDropdownMenuItemPrimitive>
                                                        )
                                                    })}
                                                </div>
                                            </IGRPScrollAreaPrimitive>
                                        </IGRPDropdownMenuSubContentPrimitive>
                                    </IGRPDropdownMenuSubPrimitive>
                                ) : (
                                    // When there are no items
                                    <IGRPDropdownMenuItemPrimitive
                                        onClick={() => {
                                            if (module)
                                                onTypeChange({
                                                    value,
                                                    module
                                                } as any)
                                            else onTypeChange(value as string)
                                        }}
                                    >
                                        {renderIcon({ label, value, module })}
                                        {label}
                                    </IGRPDropdownMenuItemPrimitive>
                                )}
                            </React.Fragment>
                        )
                    })}
            </IGRPDropdownMenuContentPrimitive>
        </IGRPDropdownMenuPrimitive>
    )
}
