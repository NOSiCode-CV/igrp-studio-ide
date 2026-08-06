import { Button } from '@renderer/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
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
                    {module === 'shared' ? 'C' : module.charAt(0).toUpperCase()}
                </div>
            )
        }
        return null
    }
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={variant} className={cn('h-6 px-2 text-sm', className)}>
                    <span className="flex flex-1">{type || 'Set Type'}</span>
                    {children}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60">
                {schemaTypes &&
                    schemaTypes.map(({ label, value, module, items }) => {
                        return (
                            <React.Fragment key={value}>
                                {items && typeof items === 'object' && !Array.isArray(items) ? (
                                    // Categorized types: Data Types → Category → Type (3 levels, horizontal)
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>{label}</DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent className="min-w-40 max-h-[60svh] overflow-y-auto">
                                            {Object.entries(items).map(
                                                ([category, subItems]) => (
                                                    <DropdownMenuSub key={category}>
                                                        <DropdownMenuSubTrigger>
                                                            {getLabel(category)}
                                                        </DropdownMenuSubTrigger>
                                                        <DropdownMenuSubContent className="min-w-40 max-h-[60svh] overflow-y-auto">
                                                            {(subItems as string[]).map(
                                                                (subItemValue, key) => (
                                                                    <DropdownMenuItem
                                                                        key={key}
                                                                        onClick={() =>
                                                                            onTypeChange({
                                                                                type: value,
                                                                                value: subItemValue
                                                                            } as any)
                                                                        }
                                                                    >
                                                                        {getLabel(subItemValue)}
                                                                    </DropdownMenuItem>
                                                                )
                                                            )}
                                                        </DropdownMenuSubContent>
                                                    </DropdownMenuSub>
                                                )
                                            )}
                                        </DropdownMenuSubContent>
                                    </DropdownMenuSub>
                                ) : items && Array.isArray(items) && items.length > 0 ? (
                                    // When items is an array (your original case)
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>{label}</DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent className="min-w-50">
                                            <div className="max-h-[60svh] overflow-y-auto">
                                                {items.map((subItem, key) => (
                                                    <DropdownMenuItem
                                                        key={key}
                                                        onClick={() =>
                                                            onTypeChange({
                                                                type: value,
                                                                value: subItem.value,
                                                                module: subItem.module
                                                            } as any)
                                                        }
                                                    >
                                                        {renderIcon(subItem)}
                                                        {subItem.label}
                                                    </DropdownMenuItem>
                                                ))}
                                            </div>
                                        </DropdownMenuSubContent>
                                    </DropdownMenuSub>
                                ) : (
                                    // When there are no items
                                    <DropdownMenuItem
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
                                    </DropdownMenuItem>
                                )}
                            </React.Fragment>
                        )
                    })}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
