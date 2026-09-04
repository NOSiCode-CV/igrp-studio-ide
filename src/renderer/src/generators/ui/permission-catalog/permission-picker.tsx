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
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CreatePermissionDialog } from './create-permission-dialog'
import { usePermissionCatalog } from './PermissionCatalogContext'
import type { PermissionKeySuggestionContext } from './suggestPermissionKey'
import type { PermissionCatalogEntry } from './types'

const PERMISSION_KEY_PATTERN = /^[a-z][a-z0-9_.]*$/

interface PermissionPickerProps {
    value: string[]
    onChange: (keys: string[]) => void
    /** Keys in `value` that are external (already exist in the backend/token) — not tracked in the project catalog. */
    externalKeys?: string[]
    /** Called when the user submits a raw key via the "use existing permission" input. */
    onAddExternal?: (key: string) => void
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
    externalKeys = [],
    onAddExternal,
    suggestedKeys = [],
    suggestionContext,
    className
}: PermissionPickerProps) {
    const { t } = useTranslation()
    const { catalog, recentKeys, addPermission } = usePermissionCatalog()
    const [open, setOpen] = useState(false)
    const [createOpen, setCreateOpen] = useState(false)
    const [externalInput, setExternalInput] = useState('')
    const [externalError, setExternalError] = useState('')

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

    const pinnedKeys = useMemo(() => {
        const keys = new Set<string>()
        suggestedEntries.forEach((e) => keys.add(e.key))
        recentEntries.forEach((e) => keys.add(e.key))
        return keys
    }, [suggestedEntries, recentEntries])

    const remainingEntries = useMemo(
        () => catalog.filter((e) => !pinnedKeys.has(e.key)),
        [catalog, pinnedKeys]
    )

    const toggle = (key: string) => {
        onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key])
    }

    const remove = (key: string) => {
        onChange(value.filter((k) => k !== key))
    }

    const handleCreated = (key: string) => {
        if (!value.includes(key)) onChange([...value, key])
        setCreateOpen(false)
        setOpen(false)
    }

    const submitExternal = () => {
        const key = externalInput.trim()
        if (!key) return
        if (!PERMISSION_KEY_PATTERN.test(key)) {
            setExternalError(
                t(
                    'permissionKeyInvalid',
                    'Use lowercase letters, numbers, dots and underscores (e.g. app.page.action).'
                )
            )
            return
        }
        setExternalError('')
        if (!value.includes(key)) {
            onAddExternal ? onAddExternal(key) : onChange([...value, key])
        }
        setExternalInput('')
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
                        const isExternal = externalKeys.includes(key)
                        return (
                            <Badge
                                key={key}
                                variant={isExternal ? 'outline' : 'secondary'}
                                className="text-xs gap-1"
                            >
                                <span className="font-mono">{key}</span>
                                {isExternal ? (
                                    <span className="text-muted-foreground ml-1">
                                        · {t('externalPermission', 'external')}
                                    </span>
                                ) : (
                                    entry?.label && (
                                        <span className="text-muted-foreground ml-1">
                                            · {entry.label}
                                        </span>
                                    )
                                )}
                                <button
                                    type="button"
                                    onClick={() => remove(key)}
                                    className="ml-1 rounded-sm opacity-60 hover:opacity-100"
                                    aria-label={t('removePermission', 'Remove permission')}
                                >
                                    <X className="h-3 w-3" />
                                </button>
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
                        <ScrollArea className="max-h-72">
                            <CommandList className="max-h-none overflow-visible">
                                <CommandEmpty>{t('noItemFound', 'No items found')}</CommandEmpty>
                                {suggestedEntries.length > 0 && (
                                    <CommandGroup
                                        heading={t('suggestedPermissions', 'Suggested')}
                                    >
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
                                        {suggestedEntries.length > 0 && <CommandSeparator />}
                                        <CommandGroup
                                            heading={t('recentPermissions', 'Recently used')}
                                        >
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
                                {remainingEntries.length > 0 && (
                                    <>
                                        {(suggestedEntries.length > 0 ||
                                            recentEntries.length > 0) && <CommandSeparator />}
                                        <CommandGroup
                                            heading={t('allPermissions', 'All permissions')}
                                        >
                                            {remainingEntries.map((entry) => (
                                                <CatalogItem
                                                    key={`all-${entry.id}`}
                                                    entry={entry}
                                                    selected={value.includes(entry.key)}
                                                    onToggle={() => toggle(entry.key)}
                                                />
                                            ))}
                                        </CommandGroup>
                                    </>
                                )}
                            </CommandList>
                        </ScrollArea>
                        <div className="border-t p-2 space-y-2">
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
                            <p className="px-1 text-[11px] text-muted-foreground">
                                {t(
                                    'createPermissionSyncHint',
                                    'Registered in the project catalog and synced with Access Management.'
                                )}
                            </p>
                            <div className="space-y-1 px-1">
                                <div className="flex gap-1.5">
                                    <input
                                        value={externalInput}
                                        onChange={(e) => {
                                            setExternalInput(e.target.value)
                                            if (externalError) setExternalError('')
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                submitExternal()
                                            }
                                        }}
                                        placeholder={t(
                                            'useExistingPermissionPlaceholder',
                                            'e.g. delete_invoice'
                                        )}
                                        className="h-8 flex-1 rounded-md border bg-transparent px-2 text-xs font-mono outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={submitExternal}
                                        disabled={!externalInput.trim()}
                                    >
                                        {t('use', 'Use')}
                                    </Button>
                                </div>
                                {externalError ? (
                                    <p className="text-[11px] text-destructive">{externalError}</p>
                                ) : (
                                    <p className="text-[11px] text-muted-foreground">
                                        {t(
                                            'useExistingPermissionHint',
                                            'Already granted by the backend (in the access token) — reuse it here without registering it in the project catalog.'
                                        )}
                                    </p>
                                )}
                            </div>
                        </div>
                    </Command>
                </PopoverContent>
            </Popover>

            <CreatePermissionDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                suggestionContext={suggestionContext}
                onCreated={async (input) => {
                    const entry = await addPermission(input)
                    handleCreated(entry.key)
                }}
            />
        </div>
    )
}
