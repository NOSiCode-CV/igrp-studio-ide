import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator
} from '@renderer/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { cn } from '@renderer/lib/utils'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CreatePermissionDialog } from './create-permission-dialog'
import { usePermissionCatalog } from './PermissionCatalogContext'
import type { PermissionKeySuggestionContext } from './suggestPermissionKey'
import type { PermissionCatalogEntry } from './types'

interface PermissionPickerProps {
    value: string[]
    onChange: (keys: string[]) => void
    suggestedKeys?: string[]
    suggestionContext?: PermissionKeySuggestionContext
    className?: string
}

function CatalogItem({
    entry,
    selected,
    onToggle
}: {
    entry: PermissionCatalogEntry
    selected: boolean
    onToggle: () => void
}) {
    return (
        <CommandItem onSelect={onToggle} className="flex items-start gap-2">
            <div
                className={cn(
                    'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-primary',
                    selected ? 'bg-primary text-primary-foreground' : 'opacity-50'
                )}
            >
                {selected && <Check className="h-3 w-3" />}
            </div>
            <div className="min-w-0 flex-1">
                <span className="font-mono text-xs">{entry.key}</span>
                <p className="text-xs text-muted-foreground truncate">{entry.label}</p>
            </div>
        </CommandItem>
    )
}

export function PermissionPicker({
    value,
    onChange,
    suggestedKeys = [],
    suggestionContext,
    className
}: PermissionPickerProps) {
    const { t } = useTranslation()
    const { catalog, recentKeys, addPermission } = usePermissionCatalog()
    const [open, setOpen] = useState(false)
    const [createOpen, setCreateOpen] = useState(false)

    const recentEntries = useMemo(
        () =>
            recentKeys
                .map((k) => catalog.find((e) => e.key === k))
                .filter((e): e is PermissionCatalogEntry => !!e && !suggestedKeys.includes(e.key)),
        [recentKeys, catalog, suggestedKeys]
    )

    const suggestedEntries = useMemo(
        () =>
            suggestedKeys
                .map((k) => catalog.find((e) => e.key === k))
                .filter((e): e is PermissionCatalogEntry => !!e),
        [suggestedKeys, catalog]
    )

    const allEntries = useMemo(() => {
        const seen = new Set<string>()
        const ordered: PermissionCatalogEntry[] = []
        for (const list of [suggestedEntries, recentEntries, catalog]) {
            for (const e of list) {
                if (!seen.has(e.key)) {
                    seen.add(e.key)
                    ordered.push(e)
                }
            }
        }
        return ordered
    }, [catalog, recentEntries, suggestedEntries])

    const toggle = (key: string) => {
        onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key])
    }

    const handleCreated = (key: string) => {
        if (!value.includes(key)) onChange([...value, key])
        setCreateOpen(false)
        setOpen(false)
    }

    return (
        <div className={cn('space-y-2', className)}>
            <div className="flex flex-wrap gap-1.5 min-h-9 rounded-md border p-2">
                {value.length === 0 ? (
                    <span className="text-xs text-muted-foreground px-1 py-1">
                        {t('permissionPickerEmpty', 'No permissions selected')}
                    </span>
                ) : (
                    value.map((key) => {
                        const entry = catalog.find((e) => e.key === key)
                        return (
                            <Badge key={key} variant="secondary" className="text-xs">
                                <span className="font-mono">{key}</span>
                                {entry?.label && (
                                    <span className="text-muted-foreground ml-1">· {entry.label}</span>
                                )}
                            </Badge>
                        )
                    })
                )}
            </div>

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-between font-normal"
                        size="sm"
                    >
                        {t('choosePermissions', 'Choose permissions…')}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[min(360px,var(--radix-popover-content-available-width))] p-0"
                    align="start"
                >
                    <Command>
                        <CommandInput placeholder={t('searchPermissions', 'Search catalog…')} />
                        <CommandList>
                            <CommandEmpty>{t('noItemFound', 'No items found')}</CommandEmpty>
                            {suggestedEntries.length > 0 && (
                                <CommandGroup heading={t('suggestedPermissions', 'Suggested')}>
                                    {suggestedEntries.map((entry) => (
                                        <CatalogItem
                                            key={entry.id}
                                            entry={entry}
                                            selected={value.includes(entry.key)}
                                            onToggle={() => toggle(entry.key)}
                                        />
                                    ))}
                                </CommandGroup>
                            )}
                            {recentEntries.length > 0 && (
                                <>
                                    <CommandSeparator />
                                    <CommandGroup heading={t('recentPermissions', 'Recently used')}>
                                        {recentEntries.map((entry) => (
                                            <CatalogItem
                                                key={entry.id}
                                                entry={entry}
                                                selected={value.includes(entry.key)}
                                                onToggle={() => toggle(entry.key)}
                                            />
                                        ))}
                                    </CommandGroup>
                                </>
                            )}
                            <CommandSeparator />
                            <CommandGroup heading={t('allPermissions', 'All permissions')}>
                                <ScrollArea className="max-h-48">
                                    {allEntries.map((entry) => (
                                        <CatalogItem
                                            key={`all-${entry.id}`}
                                            entry={entry}
                                            selected={value.includes(entry.key)}
                                            onToggle={() => toggle(entry.key)}
                                        />
                                    ))}
                                </ScrollArea>
                            </CommandGroup>
                        </CommandList>
                        <div className="border-t p-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => setCreateOpen(true)}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                {t('createNewPermission', 'Create new permission…')}
                            </Button>
                        </div>
                    </Command>
                </PopoverContent>
            </Popover>

            <CreatePermissionDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                suggestionContext={suggestionContext}
                onCreated={(input) => {
                    const entry = addPermission(input)
                    handleCreated(entry.key)
                }}
            />
        </div>
    )
}
