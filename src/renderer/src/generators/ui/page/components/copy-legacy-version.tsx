import {
    IGRPButtonPrimitive,
    IGRPDialogContentPrimitive,
    IGRPDialogDescriptionPrimitive,
    IGRPDialogFooterPrimitive,
    IGRPDialogHeaderPrimitive,
    IGRPDialogPrimitive,
    IGRPDialogTitlePrimitive
} from '@igrp/igrp-framework-react-design-system'
import type { ProcessStepConfig } from '@igrp/igrp-studio-nextjs-engine/types'
import { SelectInput } from '@renderer/generators/api/components/inputs-form'
import { Copy, Plus } from 'lucide-react'
import type React from 'react'
import { startTransition, useEffect, useMemo, useRef, useState } from 'react'
import type { FileTree } from 'src/main/types'
import { isVersionFolderName } from '../utils/form-key-utils'

interface CopyLegacyVersionModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: (
        componentDescription: string,
        componentName: string,
        previousComponent?: ProcessStepConfig
    ) => void
    processFound: FileTree | undefined
    bpmnProcesses: FileTree[]
}

export const CopyLegacyVersionModal: React.FC<CopyLegacyVersionModalProps> = ({
    open,
    onOpenChange,
    onConfirm,
    processFound,
    bpmnProcesses
}) => {
    const [previousComponent, setPreviousComponent] = useState<ProcessStepConfig | undefined>(
        undefined
    )
    const availableProcesses = useMemo(() => {
        if (!bpmnProcesses?.length) return []
        return bpmnProcesses
            .map((process) => {
                const versionFolder = process.children?.find(
                    (child) => child.isDirectory && isVersionFolderName(child.name)
                )
                if (!versionFolder) return null
                return {
                    label: `${process.name} - ${versionFolder.children?.find((child) => child.name === `${process.name}.json`)?.content?.description ?? '—'}`,
                    value: process.name
                }
            })
            .filter((item): item is { label: string; value: string } => item !== null)
    }, [bpmnProcesses])

    const [selectedProcess, setSelectedProcess] = useState<FileTree | undefined>(undefined)
    const [availableVersions, setAvailableVersions] = useState<
        Array<{ label: string; value: string }>
    >([])
    const [availableComponents, setAvailableComponents] = useState<
        Array<{ label: string; value: string }>
    >([])
    const prevOpenRef = useRef(open)
    useEffect(() => {
        if (open && !prevOpenRef.current) {
            // Modal just opened, reset form state
            startTransition(() => {
                setPreviousComponent(undefined)
                // If no processFound, reset selections
                if (!processFound) {
                    setSelectedProcess(undefined)
                    setAvailableVersions([])
                    setAvailableComponents([])
                }
            })
        }
        prevOpenRef.current = open
    }, [open, processFound])

    const handleConfirm = (): void => {
        onConfirm(
            previousComponent?.description || '',
            previousComponent?.name || '',
            previousComponent
        )
        onOpenChange(false)
    }

    const handleCancel = (): void => {
        onOpenChange(false)
    }

    const hasAvailableVersions = availableVersions.length > 0
    const hasAvailableProcesses = availableProcesses.length > 0

    const handleProcessChange = (processName: string): void => {
        const process = bpmnProcesses.find((p) => p.name === processName)
        if (process) {
            setSelectedProcess(process)
            const versions = process.children
                ?.filter((child) => child.isDirectory && isVersionFolderName(child.name))
                .map((child) => ({
                    label: child.name,
                    value: child.name
                }))

            setAvailableVersions(versions || [])
            // Clear version and component selections
            setAvailableComponents([])
            setPreviousComponent(undefined)
        }
    }

    const handleVersionChange = async (version: string): Promise<void> => {
        const components = selectedProcess?.children
            ?.find((child) => child.name === version)
            ?.children?.filter((child) => child.content.type !== 'process')
            .map((child) => ({
                label: child.content.description || child.content.name,
                value: child.content
            }))

        setAvailableComponents(components || [])
    }

    const handleComponentChange = (component: ProcessStepConfig | undefined): void => {
        setPreviousComponent(component)
    }

    return (
        <IGRPDialogPrimitive open={open} onOpenChange={onOpenChange}>
            <IGRPDialogContentPrimitive>
                <IGRPDialogHeaderPrimitive>
                    <IGRPDialogTitlePrimitive className="flex items-center gap-2">
                        <Copy className="h-5 w-5" />
                        Copy Legacy Version
                    </IGRPDialogTitlePrimitive>
                    <IGRPDialogDescriptionPrimitive>
                        Copy a legacy version of a process.
                    </IGRPDialogDescriptionPrimitive>
                </IGRPDialogHeaderPrimitive>

                <div className="space-y-6 py-4">
                    {/* Copy from Previous Version */}
                    {hasAvailableProcesses && (
                        <div className="space-y-4">
                            <SelectInput
                                id="process-select"
                                label="Select Process"
                                options={availableProcesses}
                                onChange={(value) => handleProcessChange(value as string)}
                                placeholder="Choose a process..."
                            />
                            {hasAvailableVersions && (
                                <>
                                    <SelectInput
                                        id="version-select"
                                        label="Available Versions"
                                        options={availableVersions}
                                        onChange={(value) => handleVersionChange(value as string)}
                                        placeholder="Choose a version..."
                                    />
                                    <SelectInput
                                        id="component-select"
                                        label="Components"
                                        options={availableComponents}
                                        onChange={(value) =>
                                            handleComponentChange(
                                                value as unknown as ProcessStepConfig | undefined
                                            )
                                        }
                                        placeholder="Choose a component..."
                                    />
                                </>
                            )}
                        </div>
                    )}
                </div>

                <IGRPDialogFooterPrimitive className="gap-2">
                    <IGRPButtonPrimitive variant="outline" onClick={handleCancel}>
                        Cancel
                    </IGRPButtonPrimitive>
                    <IGRPButtonPrimitive onClick={handleConfirm} className="gap-2">
                        <Plus className="h-4 w-4" />
                        {'Copy Step'}
                    </IGRPButtonPrimitive>
                </IGRPDialogFooterPrimitive>
            </IGRPDialogContentPrimitive>
        </IGRPDialogPrimitive>
    )
}
