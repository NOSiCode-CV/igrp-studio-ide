'use client';

import type * as React from 'react';
import { CuboidIcon as Cube, Plus } from 'lucide-react';
import { cn } from '@renderer/lib/utils';
import { Button } from '@renderer/components/ui/button';
import { Separator } from './ui/separator';
import { useTranslation } from 'react-i18next';

interface EmptyListProps extends React.HTMLAttributes<HTMLDivElement> {
    icon?: React.ReactNode;
    title?: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    shortcut?: string;
}

export function EmptyList({
    
    icon = <Cube className="h-12 w-12 text-muted-foreground/60" />,
    title = 'No items created yet',
    description = 'Items let you organize content in your sidebar. Create an item to get started.',
    actionLabel,
    onAction,
    shortcut,
    className,
    ...props
}: EmptyListProps) {
    const { t } = useTranslation();
    return (
        <div
            className={cn(
                'flex h-full w-full flex-col items-center justify-center gap-2 text-center p-8 border bg-card rounded border-dashed',
                className
            )}
            {...props}
        >
            <div className="rounded-lg border border-dashed p-4">{icon}</div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">
                {title}
            </h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
                {description}
            </p>

            {actionLabel && onAction && (
                <Button onClick={onAction} variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    {actionLabel}
                </Button>
            )}

            {shortcut && (
                <>
                    <Separator orientation="horizontal" />
                    <p className="mt-4 text-sm text-muted-foreground">
                    {t('createShortcut')}{' '}
                        <kbd className="font-semibold">{shortcut}</kbd>
                    </p>
                </>
            )}
        </div>
    );
}
