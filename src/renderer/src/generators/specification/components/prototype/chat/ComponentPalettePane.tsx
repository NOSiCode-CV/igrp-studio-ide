import { Input } from '@renderer/components/ui/input'
import {
    PaletteComponentCard,
    useEnginePalette
} from '@renderer/features/component-palette'
import { useEngineCatalog } from '@renderer/features/engine-catalog'
import { Search } from 'lucide-react'
import { useEffect, useMemo, useState, type JSX } from 'react'

/**
 * The "Palette" mode of the Prototype chat aside (M4.28).
 *
 * Pulls the engine's component catalog
 * (`window.engine.getComponent(NEXTJS)`) — the same source the UI
 * generator's visual palette uses, so the Prototype design intent
 * stays in sync with what the engine actually knows how to generate.
 * The provider lives at App root, so calling this hook is safe even
 * before the UI generator is mounted.
 *
 * Components are grouped (typography / forms / containers / …) and
 * fuzzy-filterable by name / id / group label. Pinning is toggle-by-
 * click; removal is via the chip in the chat composer (and is reflected
 * here by the active state).
 *
 * Extracted from `PrototypePanel.tsx` as part of the prototype refactor
 * (P6 — chat chrome + footer).
 */
export const ComponentPalettePane = ({
    attachedIds,
    onToggle
}: {
    attachedIds: string[]
    onToggle: (id: string) => void
}): JSX.Element => {
    const [query, setQuery] = useState('')

    // Pull the engine's component catalog (`window.engine.getComponent(NEXTJS)`)
    // — the same source the UI generator's visual palette uses, so the
    // Prototype design intent stays in sync with what the engine actually
    // knows how to generate. The provider lives at App root, so it's safe to
    // call from here even before the UI generator is mounted.
    const { componentsRegistered, loadRegistryComponent, isLoading } = useEngineCatalog()
    useEffect(() => {
        if (componentsRegistered.length === 0) {
            void loadRegistryComponent()
        }
    }, [componentsRegistered.length, loadRegistryComponent])

    const palette = useEnginePalette(componentsRegistered)

    const filteredGroups = useMemo(() => {
        const needle = query.trim().toLowerCase()
        if (!needle) return palette.groups
        return palette.groups
            .map((g) => ({
                ...g,
                items: g.items.filter(
                    (c) =>
                        c.name.toLowerCase().includes(needle) ||
                        c.id.toLowerCase().includes(needle) ||
                        g.label.toLowerCase().includes(needle)
                )
            }))
            .filter((g) => g.items.length > 0)
    }, [palette.groups, query])

    const attachedSet = useMemo(() => new Set(attachedIds), [attachedIds])
    const empty = componentsRegistered.length === 0
    const noMatch = !empty && filteredGroups.length === 0

    return (
        <div className="flex h-full w-full flex-col">
            <div className="border-b px-3 py-2">
                <div className="relative">
                    <Search
                        size={11}
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                        placeholder="Find a component…"
                        className="h-7 pl-7 text-[11px]"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground">
                    Click to pin · remove via chip in chat
                    {attachedIds.length > 0 && (
                        <span className="ml-1 font-medium text-primary">
                            · {attachedIds.length} pinned
                        </span>
                    )}
                </p>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                {empty ? (
                    <p className="px-2 py-3 text-[11px] italic text-muted-foreground">
                        {isLoading
                            ? 'Loading engine catalog…'
                            : 'No components available — engine catalog is empty.'}
                    </p>
                ) : noMatch ? (
                    <p className="px-2 py-3 text-[11px] italic text-muted-foreground">
                        No components match "{query}".
                    </p>
                ) : (
                    filteredGroups.map((group) => (
                        <section key={group.key} className="mb-3">
                            <h4 className="mb-1.5 px-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                                {group.label}
                            </h4>
                            <div className="grid grid-cols-2 gap-1.5">
                                {group.items.map((c) => (
                                    <PaletteComponentCard
                                        key={c.id}
                                        icon={c.icon}
                                        label={c.name}
                                        deprecated={c.deprecated}
                                        active={attachedSet.has(c.id)}
                                        showGripHint={false}
                                        onClick={() => onToggle(c.id)}
                                    />
                                ))}
                            </div>
                        </section>
                    ))
                )}
            </div>
        </div>
    )
}
