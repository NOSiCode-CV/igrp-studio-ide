'use client'

import * as React from 'react'
import { ChevronDownIcon, icons as LucideIcons } from 'lucide-react'
import { Accordion as AccordionPrimitive } from 'radix-ui'

import { cn } from '@renderer/lib/utils'

// IGRP's accordion trigger supported optional left/right icons resolved by
// name (e.g. `iconName="Plus"`). We preserve that shape so the migrated
// callers keep working without per-site rewrites. Pass `showIcon` to
// render — defaults to ChevronDown like vanilla shadcn — and use
// `iconPlacement="start" | "end"` to control where it sits.
type LucideIconName = keyof typeof LucideIcons

function Accordion({ ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>) {
    return <AccordionPrimitive.Root data-slot="accordion" {...props} />
}

function AccordionItem({
    className,
    ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
    return (
        <AccordionPrimitive.Item
            data-slot="accordion-item"
            className={cn('border-b last:border-b-0', className)}
            {...props}
        />
    )
}

type AccordionTriggerProps = React.ComponentProps<typeof AccordionPrimitive.Trigger> & {
    /** Show an icon next to the children (defaults to ChevronDown). */
    showIcon?: boolean
    /** Lucide icon name. Defaults to `ChevronDown`. */
    iconName?: LucideIconName | string
    /** Where the icon sits — `end` is the typical chevron position. */
    iconPlacement?: 'start' | 'end'
}

function AccordionTrigger({
    className,
    children,
    showIcon = true,
    iconName,
    iconPlacement = 'end',
    ...props
}: AccordionTriggerProps) {
    const Icon = iconName
        ? ((LucideIcons[iconName as LucideIconName] as React.ComponentType<{
              className?: string
          }>) ?? ChevronDownIcon)
        : ChevronDownIcon
    return (
        <AccordionPrimitive.Header className="flex">
            <AccordionPrimitive.Trigger
                data-slot="accordion-trigger"
                className={cn(
                    'flex flex-1 items-start gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180',
                    iconPlacement === 'end' && 'justify-between',
                    className
                )}
                {...props}
            >
                {showIcon && iconPlacement === 'start' && (
                    <Icon className="pointer-events-none size-4 shrink-0 translate-y-0.5 text-muted-foreground transition-transform duration-200" />
                )}
                {children}
                {showIcon && iconPlacement === 'end' && (
                    <Icon className="pointer-events-none size-4 shrink-0 translate-y-0.5 text-muted-foreground transition-transform duration-200 order-last" />
                )}
            </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>
    )
}

function AccordionContent({
    className,
    children,
    ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
    return (
        <AccordionPrimitive.Content
            data-slot="accordion-content"
            className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
            {...props}
        >
            <div className={cn('pt-0 pb-4', className)}>{children}</div>
        </AccordionPrimitive.Content>
    )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
