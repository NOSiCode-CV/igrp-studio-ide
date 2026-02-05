import React, { useState, useEffect, useMemo, useRef, startTransition } from 'react'
import {
  IGRPButtonPrimitive,
  IGRPDialogContentPrimitive,
  IGRPDialogDescriptionPrimitive,
  IGRPDialogFooterPrimitive,
  IGRPDialogHeaderPrimitive,
  IGRPDialogPrimitive,
  IGRPDialogTitlePrimitive
} from '@igrp/igrp-framework-react-design-system'
import { Plus } from 'lucide-react'
import { SelectInput, TextInput } from '@renderer/generators/api/components/inputs-form'
import { useTranslation } from 'react-i18next'
import { FileTree } from 'src/main/types'
import { ProcessStepConfig } from '@igrp/igrp-studio-nextjs-engine/types'
import { isVersionFolderName } from '../utils/form-key-utils'

interface GenerateNewStepFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (
    componentDescription: string,
    componentName: string,
    previousComponent?: ProcessStepConfig
  ) => void
  defaultComponentName: string
  defaultComponentDescription?: string
  processFound: FileTree | undefined
  bpmnProcesses: FileTree[]
}

export const GenerateNewStepForm: React.FC<GenerateNewStepFormProps> = ({
  open,
  onOpenChange,
  onConfirm,
  defaultComponentName,
  defaultComponentDescription = '',
  processFound,
  bpmnProcesses
}) => {
  const { t } = useTranslation()

  const [description, setDescription] = useState(defaultComponentDescription)
  const [componentName, setComponentName] = useState(defaultComponentName)
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
        if (versionFolder) return null
        return {
          label: `${process.name} - ${process.children?.find((child) => child.name === `${process.name}.json`)?.content?.description ?? '—'}`,
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
        setDescription(defaultComponentDescription)
        setComponentName(defaultComponentName)
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
  }, [open, defaultComponentDescription, defaultComponentName, processFound])

  const handleConfirm = (): void => {
    if (!description.trim() || !componentName.trim()) return

    onConfirm(description.trim(), componentName.trim(), previousComponent)
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
      const versions = process.children?.map((child) => ({
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
            <Plus className="h-5 w-5" />
            Configure New Step
          </IGRPDialogTitlePrimitive>
          <IGRPDialogDescriptionPrimitive>
            Configure the new step name and optionally copy from an existing version.
          </IGRPDialogDescriptionPrimitive>
        </IGRPDialogHeaderPrimitive>

        <div className="space-y-6 py-4">
          <TextInput
            id="description"
            label={t('Component Description')}
            onChange={(e) => setDescription(e.target.value)}
            value={description || ''}
            placeholder="Enter component description..."
            isRequired
          />
          <TextInput
            id="name"
            label={t('Component Name')}
            className="col-span-3"
            onChange={(e) => setComponentName(e.target.value)}
            value={componentName || ''}
            placeholder="Enter component name..."
            isRequired
          />

          {/* Copy from Previous Version */}
          {hasAvailableProcesses && (
            <div className="space-y-4">
              <p className="text-sm font-medium">Copy from previous version</p>
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
                      handleComponentChange(value as unknown as ProcessStepConfig | undefined)
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
          <IGRPButtonPrimitive
            onClick={handleConfirm}
            disabled={!description.trim() || !componentName.trim()}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            {previousComponent ? 'Copy Step' : 'Generate Step'}
          </IGRPButtonPrimitive>
        </IGRPDialogFooterPrimitive>
      </IGRPDialogContentPrimitive>
    </IGRPDialogPrimitive>
  )
}
