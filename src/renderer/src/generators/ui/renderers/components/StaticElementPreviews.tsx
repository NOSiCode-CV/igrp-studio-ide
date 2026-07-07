import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    IGRPIcon,
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink
} from '@igrp/igrp-framework-react-design-system'
import { cn } from '@renderer/lib/utils'
import { Check, ChevronLeft, ChevronRight, Crop, Inbox } from 'lucide-react'
import type React from 'react'
import { Fragment } from 'react'

/**
 * Static canvas previews for engine *leaf* components whose design-system
 * counterparts are composable primitives (`breadcrumb`, `pagination`,
 * `inputOTP`, `inputGroup`, `empty`, `stepperUI`, `navigationMenu`,
 * `imageCropper`, `banner`). The engine generates the real internal
 * structure; the canvas needs a faithful-looking placeholder that HONOURS
 * the engine props the user edits (defaults are fallbacks only). Prop names
 * mirror each component's engine `getProperties()` schema.
 */

interface BreadcrumbEngineItem {
    label?: string
    href?: string
    currentPage?: boolean
}

export const IGRPStudioBreadcrumb = ({
    items,
    className
}: {
    items?: BreadcrumbEngineItem[]
    className?: string
}): React.ReactElement => {
    const resolved =
        Array.isArray(items) && items.length > 0
            ? items
            : [{ label: 'Home' }, { label: 'Section' }, { label: 'Current', currentPage: true }]

    return (
        <Breadcrumb className={className}>
            <BreadcrumbList>
                {resolved.map((item, index) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: static preview list
                    <Fragment key={index}>
                        <BreadcrumbItem>
                            {item.currentPage || index === resolved.length - 1 ? (
                                <BreadcrumbPage>{item.label || 'Page'}</BreadcrumbPage>
                            ) : (
                                <BreadcrumbLink>{item.label || 'Page'}</BreadcrumbLink>
                            )}
                        </BreadcrumbItem>
                        {index < resolved.length - 1 && <BreadcrumbSeparator />}
                    </Fragment>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    )
}

export const IGRPStudioPagination = ({
    currentPage,
    totalPages,
    previousLabel,
    nextLabel,
    className
}: {
    currentPage?: number
    totalPages?: number
    previousLabel?: string
    nextLabel?: string
    className?: string
}): React.ReactElement => {
    const total = Number(totalPages) > 0 ? Number(totalPages) : 3
    const current = Math.min(Math.max(Number(currentPage) || 1, 1), total)
    const pages = Array.from({ length: Math.min(total, 3) }, (_, i) => i + 1)

    return (
        <Pagination className={className}>
            <PaginationContent>
                <PaginationItem>
                    <PaginationLink className="w-auto gap-1 px-2">
                        <ChevronLeft className="h-4 w-4" />
                        {previousLabel || 'Previous'}
                    </PaginationLink>
                </PaginationItem>
                {pages.map((page) => (
                    <PaginationItem key={page}>
                        <PaginationLink isActive={page === current}>{page}</PaginationLink>
                    </PaginationItem>
                ))}
                {total > 3 && (
                    <PaginationItem>
                        <PaginationEllipsis />
                    </PaginationItem>
                )}
                <PaginationItem>
                    <PaginationLink className="w-auto gap-1 px-2">
                        {nextLabel || 'Next'}
                        <ChevronRight className="h-4 w-4" />
                    </PaginationLink>
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    )
}

export const IGRPStudioInputOTP = ({
    maxLength,
    className
}: {
    maxLength?: number
    className?: string
}): React.ReactElement => {
    const length = Number(maxLength) > 0 ? Math.min(Number(maxLength), 12) : 6
    const midpoint = length > 3 ? Math.ceil(length / 2) : length

    return (
        <div className={cn('flex w-fit items-center gap-1', className)}>
            {Array.from({ length }, (_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static preview slots
                <Fragment key={i}>
                    {i === midpoint && length > 3 && (
                        <span className="px-1 text-muted-foreground">-</span>
                    )}
                    <div className="flex h-9 w-9 items-center justify-center rounded-md border text-sm shadow-xs">
                        {i === 0 ? '1' : ''}
                    </div>
                </Fragment>
            ))}
        </div>
    )
}

export const IGRPStudioInputGroup = ({
    label,
    className
}: {
    label?: React.ReactNode
    className?: string
}): React.ReactElement => (
    <div
        className={cn(
            'flex h-9 w-full max-w-sm items-stretch overflow-hidden rounded-md border shadow-xs',
            className
        )}
    >
        <span className="flex items-center border-r bg-muted px-3 text-sm text-muted-foreground">
            {label || 'https://'}
        </span>
        <span className="flex flex-1 items-center px-3 text-sm text-muted-foreground">
            example.com
        </span>
    </div>
)

export const IGRPStudioEmpty = ({
    title,
    description,
    iconName,
    className
}: {
    title?: React.ReactNode
    description?: React.ReactNode
    iconName?: string
    className?: string
}): React.ReactElement => (
    <div
        className={cn(
            'flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed p-8 text-center',
            className
        )}
    >
        {iconName ? (
            <IGRPIcon iconName={iconName} className="h-8 w-8 text-muted-foreground" />
        ) : (
            <Inbox className="h-8 w-8 text-muted-foreground" />
        )}
        <p className="text-sm font-medium">{title || 'No results'}</p>
        <p className="text-xs text-muted-foreground">
            {description || 'There is nothing to show here yet.'}
        </p>
    </div>
)

export const IGRPStudioStepper = ({
    value,
    defaultValue,
    orientation,
    className
}: {
    value?: number
    defaultValue?: number
    orientation?: string
    className?: string
}): React.ReactElement => {
    const active = Number(value ?? defaultValue) > 0 ? Number(value ?? defaultValue) : 2
    const vertical = orientation === 'vertical'

    return (
        <div
            className={cn(
                'flex w-full max-w-md',
                vertical ? 'h-48 flex-col items-start' : 'items-center',
                className
            )}
        >
            {[1, 2, 3].map((step, index) => (
                <div
                    key={step}
                    className={cn(
                        'flex items-center',
                        vertical && 'flex-col',
                        index < 2 && (vertical ? 'flex-1' : 'flex-1')
                    )}
                >
                    <div
                        className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                            step < active && 'bg-primary text-primary-foreground',
                            step === active && 'border-2 border-primary text-primary',
                            step > active && 'border text-muted-foreground'
                        )}
                    >
                        {step < active ? <Check className="h-4 w-4" /> : step}
                    </div>
                    {index < 2 && (
                        <div
                            className={cn(
                                'bg-border',
                                vertical ? 'my-2 h-full w-px flex-1' : 'mx-2 h-px flex-1'
                            )}
                        />
                    )}
                </div>
            ))}
        </div>
    )
}

export const IGRPStudioNavigationMenu = ({
    className
}: {
    className?: string
}): React.ReactElement => (
    <div className={cn('flex w-fit items-center gap-1 rounded-md p-1', className)}>
        {['Getting started', 'Components', 'Docs'].map((item, index) => (
            <span
                key={item}
                className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium',
                    index === 0
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent'
                )}
            >
                {item}
            </span>
        ))}
    </div>
)

export const IGRPStudioImageCropper = ({
    image,
    cropShape,
    className
}: {
    image?: string
    cropShape?: string
    className?: string
}): React.ReactElement => (
    <div
        className={cn(
            'relative flex h-40 w-full max-w-sm items-center justify-center overflow-hidden rounded-md border bg-muted/40',
            className
        )}
    >
        {image ? (
            <img src={image} alt="" className="h-full w-full object-cover" />
        ) : (
            <Crop className="h-8 w-8 text-muted-foreground" />
        )}
        <div
            className={cn(
                'absolute inset-6 border-2 border-dashed border-primary/60',
                cropShape === 'round' ? 'rounded-full' : 'rounded-sm'
            )}
        >
            {cropShape !== 'round' && (
                <>
                    <span className="absolute -top-1 -left-1 h-2 w-2 bg-primary" />
                    <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary" />
                    <span className="absolute -bottom-1 -left-1 h-2 w-2 bg-primary" />
                    <span className="absolute -right-1 -bottom-1 h-2 w-2 bg-primary" />
                </>
            )}
        </div>
    </div>
)

export const IGRPStudioBanner = ({
    message,
    variant,
    learnMoreLabel,
    acceptLabel,
    declineLabel,
    className
}: {
    message?: React.ReactNode
    variant?: string
    learnMoreLabel?: string
    acceptLabel?: string
    declineLabel?: string
    className?: string
}): React.ReactElement => (
    <div
        className={cn(
            'flex w-full flex-wrap items-center justify-between gap-3 rounded-md border p-3 text-sm',
            variant === 'destructive'
                ? 'border-destructive/40 bg-destructive/10 text-destructive'
                : 'bg-muted/40',
            className
        )}
    >
        <span>
            {message || 'We use cookies to improve your experience.'}{' '}
            <span className="font-medium underline underline-offset-2">
                {learnMoreLabel || 'Learn more'}
            </span>
        </span>
        <span className="flex items-center gap-2">
            <span className="rounded-md border px-3 py-1 text-xs font-medium">
                {declineLabel || 'Decline'}
            </span>
            <span className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                {acceptLabel || 'Accept'}
            </span>
        </span>
    </div>
)
