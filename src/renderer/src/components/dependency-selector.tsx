'use client'

import {
    IGRPBadgePrimitive,
    IGRPCommandEmptyPrimitive,
    IGRPCommandGroupPrimitive,
    IGRPCommandInputPrimitive,
    IGRPCommandItemPrimitive,
    IGRPCommandListPrimitive,
    IGRPCommandPrimitive
} from '@igrp/igrp-framework-react-design-system'
import type { Dependency } from '@igrp/igrp-studio-springboot-engine/types'
import { ENV_TYPES } from '@renderer/constants/appConstants'
import { useFramework } from '@renderer/hooks/use-framework'
import { Plus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function DependencySelector({
    onSelectedDependencies
}: {
    onSelectedDependencies: (dependencies: Dependency[]) => void
}) {
    const { t } = useTranslation()
    const framework = useFramework()
    const [selectedDependencies, setSelectedDependencies] = useState<Dependency[]>([])

    const [open, setOpen] = useState(false)

    const commandRef = useRef<HTMLDivElement>(null)

    const [availableDependencies, setAvailableDependencies] = useState<Dependency[]>([])

    const availableForSelection = availableDependencies.filter(
        (dep) =>
            !selectedDependencies.some(
                (selected) =>
                    selected.groupId === dep.groupId && selected.artifactId === dep.artifactId
            )
    )

    const handleAddDependency = (dependency: Dependency) => {
        setSelectedDependencies([...selectedDependencies, dependency])
        setOpen(false)
    }

    const handleRemoveDependency = (dependency: Dependency) => {
        setSelectedDependencies(
            selectedDependencies.filter(
                (dep) => !(dep.groupId === dependency.groupId && dep.artifactId === dep.artifactId)
            )
        )
    }

    const getDependencyFullName = (dependency: Dependency) => {
        return `${dependency.groupId}:${dependency.artifactId}`
    }

    // Handle click outside to close command
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (commandRef.current && !commandRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])
    useEffect(() => {
        // Skip the Spring-only dependency fetch for non-Spring projects (e.g. .NET).
        // `window.engine.getDependencies` is wired to the Spring engine's pom.xml
        // catalog and has no equivalent on the .NET adapter; calling it would
        // hit a no-op handler at best.
        if (framework !== ENV_TYPES.SPRING) return
        const laodDependencies = async () => {
            const { result } = await window.engine.getDependencies(ENV_TYPES.SPRING)
            setAvailableDependencies(result)
        }
        laodDependencies()
    }, [framework])

    useEffect(() => {
        onSelectedDependencies(selectedDependencies)
    }, [selectedDependencies])

    // The "Further dependencies" picker is a Spring-Boot concept (Maven
    // starters). Other backends like .NET handle their NuGet packages inside
    // the generated `.csproj` and don't expose a runtime selector, so render
    // nothing rather than show an empty Spring-flavoured picker.
    if (framework !== ENV_TYPES.SPRING) return null

    return (
        <div className="flex flex-col space-y-3">
            <h2>Further dependencies</h2>

            <div className="relative" ref={commandRef}>
                <IGRPCommandPrimitive className="rounded-lg border shadow-md">
                    <IGRPCommandInputPrimitive
                        placeholder="Type to filter, for example starter, devtools, commons, ..."
                        onFocus={() => setOpen(true)}
                        className="h-9"
                    />
                    {open && (
                        <IGRPCommandListPrimitive className="max-h-[200px] overflow-auto">
                            <IGRPCommandEmptyPrimitive>
                                {t('noDependencies')}
                            </IGRPCommandEmptyPrimitive>
                            <IGRPCommandGroupPrimitive>
                                {availableForSelection.map((dependency, index) => (
                                    <IGRPCommandItemPrimitive
                                        key={index}
                                        onSelect={() => handleAddDependency(dependency)}
                                        className="flex items-center justify-between p-2 cursor-pointer"
                                    >
                                        <div>
                                            <div className="font-medium">
                                                {getDependencyFullName(dependency)}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {dependency.name} ({dependency.scope})
                                            </div>
                                        </div>
                                        <button
                                            className="text-gray-500 hover:text-gray-700"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleAddDependency(dependency)
                                            }}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </IGRPCommandItemPrimitive>
                                ))}
                            </IGRPCommandGroupPrimitive>
                        </IGRPCommandListPrimitive>
                    )}
                </IGRPCommandPrimitive>
            </div>
            <div className="flex flex-wrap gap-2">
                {selectedDependencies.map((dependency) => (
                    <IGRPBadgePrimitive
                        key={`${dependency.groupId}:${dependency.artifactId}`}
                        variant="default"
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md flex items-center gap-2"
                    >
                        {getDependencyFullName(dependency)}
                        <button
                            onClick={() => handleRemoveDependency(dependency)}
                            className="ml-1 text-gray-500 hover:text-gray-700 focus:outline-none"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </IGRPBadgePrimitive>
                ))}
                <p className="text-sm text-gray-500 mt-2">{t('igrpStudioInfo')}</p>
            </div>
        </div>
    )
}
