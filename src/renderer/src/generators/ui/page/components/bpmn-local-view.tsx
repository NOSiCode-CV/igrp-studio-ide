import { JSX } from 'react'
import { Component, UserCog, Cloud, HardDrive } from 'lucide-react'
import {
  IGRPBadgePrimitive,
  IGRPButtonPrimitive,
  IGRPCardPrimitive,
  IGRPCardContentPrimitive,
  IGRPCardHeaderPrimitive,
  IGRPCardTitlePrimitive,
  IGRPCardDescriptionPrimitive,
  IGRPTabsPrimitive,
  IGRPTabsListPrimitive,
  IGRPTabsTriggerPrimitive,
  IGRPTabsContentPrimitive,
  IGRPToggleGroupPrimitive,
  IGRPToggleGroupItemPrimitive,
  IGRPSeparator
} from '@igrp/igrp-framework-react-design-system'
import { FileTree } from 'src/main/types'
import { PageDefinition } from '../page-manager'
import { convertFileTreeToPageDefinition } from '../utils/bpmn-helpers'
import { GenerateNewStepForm } from './generate-new-step-form'
import { SearchInput } from '@renderer/components/shared-ui'
import { EmptyList } from '@renderer/components/empty-list'
import { ProcessStepConfig } from '@igrp/igrp-studio-nextjs-engine/types'
import { BPMNProjectProcessDefinition, BPMNProjectArtifact } from 'src/main/types'

export interface BpmnLocalViewProps {
  viewMode: 'local' | 'remote'
  onViewModeChange: (value: 'local' | 'remote') => void
  processFilter: string
  onProcessFilterChange: (value: string) => void
  selectedLocalProcess: FileTree | null
  onSelectedLocalProcessChange: (process: FileTree | null) => void
  activeTab: string
  onActiveTabChange: (value: string) => void
  bpmnProcesses: FileTree[]
  hasApiProjects: boolean
  onPageClick?: (pageDefinition: PageDefinition) => void
  showAddComponentsModal: boolean
  onShowAddComponentsModalChange: (open: boolean) => void
  pendingComponentData:
  | {
    processDefinition: BPMNProjectProcessDefinition
    processArtifact: BPMNProjectArtifact
    processFound: FileTree
  }
  | undefined
  oldProcessFound: FileTree | undefined
  onConfirmStepProcess: (
    componentDescription: string,
    componentName: string,
    previousComponent?: ProcessStepConfig
  ) => Promise<void>
}

export const BpmnLocalView = ({
  viewMode,
  onViewModeChange,
  processFilter,
  onProcessFilterChange,
  selectedLocalProcess,
  onSelectedLocalProcessChange,
  activeTab,
  onActiveTabChange,
  bpmnProcesses,
  hasApiProjects,
  onPageClick,
  showAddComponentsModal,
  onShowAddComponentsModalChange,
  pendingComponentData,
  oldProcessFound,
  onConfirmStepProcess
}: BpmnLocalViewProps): JSX.Element => {
  const hasLocalProcesses = bpmnProcesses.length > 0

  if (!hasLocalProcesses) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">View Mode:</span>
            <IGRPToggleGroupPrimitive
              type="single"
              value={viewMode}
              onValueChange={(value) => {
                if (value) onViewModeChange(value as 'local' | 'remote')
              }}
            >
              <IGRPToggleGroupItemPrimitive value="local" aria-label="Local mode">
                <HardDrive className="mr-2 h-4 w-4" />
                Local
              </IGRPToggleGroupItemPrimitive>
              <IGRPToggleGroupItemPrimitive value="remote" aria-label="Remote mode">
                <Cloud className="mr-2 h-4 w-4" />
                Remote
              </IGRPToggleGroupItemPrimitive>
            </IGRPToggleGroupPrimitive>
          </div>
        </div>

        <EmptyList
          title="No local processes found"
          description="No local BPMN processes have been generated yet. Generate some processes or switch to Remote mode to view API projects."
        />
      </div>
    )
  }

  const filteredLocalProcesses = bpmnProcesses.filter((process) => {
    if (!processFilter.trim()) return true
    const filterLower = processFilter.toLowerCase()
    return (
      process.name?.toLowerCase().includes(filterLower) ||
      process.path?.toLowerCase().includes(filterLower)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">View Mode:</span>
          <IGRPToggleGroupPrimitive
            type="single"
            value={viewMode}
            onValueChange={(value) => {
              if (value) onViewModeChange(value as 'local' | 'remote')
            }}
          >
            <IGRPToggleGroupItemPrimitive value="local" aria-label="Local mode">
              <HardDrive className="mr-2 h-4 w-4" />
              Local
            </IGRPToggleGroupItemPrimitive>
            <IGRPToggleGroupItemPrimitive value="remote" aria-label="Remote mode">
              <Cloud className="mr-2 h-4 w-4" />
              Remote
            </IGRPToggleGroupItemPrimitive>
          </IGRPToggleGroupPrimitive>
        </div>
      </div>

      {!hasApiProjects && (
        <IGRPCardPrimitive className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <IGRPCardContentPrimitive className="py-4">
            <div className="flex items-start space-x-3">
              <div className="shrink-0">
                <svg
                  className="h-5 w-5 text-orange-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  No API Connection Detected
                </h4>
                <p className="mt-1 text-sm text-orange-700 dark:text-orange-300">
                  Unable to connect to remote API. Switch to &quot;Local&quot; mode to view your
                  locally generated BPMN processes, or configure an API connection in the &quot;API
                  Configuration&quot; tab.
                </p>
              </div>
            </div>
          </IGRPCardContentPrimitive>
        </IGRPCardPrimitive>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Select Process</h3>
            <p className="text-sm text-muted-foreground">
              Choose a specific process to view its artifacts
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <SearchInput
              placeholder="Filter by name or path..."
              value={processFilter}
              onChange={(value) => onProcessFilterChange(value)}
              className="lg:w-[250px]"
            />
          </div>
        </div>

        {filteredLocalProcesses.length > 0 ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {filteredLocalProcesses.map((process, index) => {
                const versions =
                  process.children?.filter(
                    (child) => child.isDirectory && child.name.match(/^v\d+$/)
                  ) || []

                const sortedVersions = versions.sort((a, b) => {
                  const numA = parseInt(a.name.replace('v', ''))
                  const numB = parseInt(b.name.replace('v', ''))
                  return numB - numA
                })

                const lastVersion = sortedVersions[0]
                const artifactCount = lastVersion?.children?.length || 0

                const processConfigFile = lastVersion?.children?.find(
                  (child) => !child.isDirectory && child.content?.type === 'process'
                )
                const processDescription =
                  processConfigFile?.content?.description || 'No description available'

                return (
                  <IGRPCardPrimitive
                    key={`${process.path}-${index}`}
                    className={`hover:shadow-md transition-all cursor-pointer ${selectedLocalProcess?.path === process.path
                      ? 'ring-2 ring-primary'
                      : 'hover:bg-muted/30'
                      }`}
                    onClick={() => {
                      onSelectedLocalProcessChange(
                        selectedLocalProcess?.path === process.path ? null : process
                      )
                    }}
                  >
                    <IGRPCardContentPrimitive>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <IGRPCardTitlePrimitive className="text-base font-medium">
                            {process.name}
                          </IGRPCardTitlePrimitive>
                          <IGRPCardDescriptionPrimitive>
                            {processDescription}
                          </IGRPCardDescriptionPrimitive>
                          <div className="flex items-center space-x-2 mt-2 text-sm text-muted-foreground">
                            <UserCog className="w-4 h-4" />
                            <span>
                              {artifactCount} artifacts {lastVersion ? `(${lastVersion.name})` : ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <IGRPBadgePrimitive variant="secondary">Local</IGRPBadgePrimitive>
                        </div>
                      </div>
                    </IGRPCardContentPrimitive>
                  </IGRPCardPrimitive>
                )
              })}
            </div>
          </div>
        ) : (
          <EmptyList
            title="No processes match your filter"
            description={`No processes match &quot;${processFilter}&quot;. Try adjusting your search terms.`}
          />
        )}
      </div>

      {selectedLocalProcess &&
        (() => {
          const versions =
            selectedLocalProcess.children?.filter(
              (child) => child.isDirectory && child.name.match(/^v\d+$/)
            ) || []

          const sortedVersions = versions.sort((a, b) => {
            const numA = parseInt(a.name.replace('v', ''))
            const numB = parseInt(b.name.replace('v', ''))
            return numB - numA
          })

          const lastVersion = sortedVersions[0]
          const artifacts = lastVersion?.children || []

          return (
            <div className="space-y-4">
              <IGRPTabsPrimitive
                value={activeTab}
                onValueChange={onActiveTabChange}
                className="w-full"
              >
                <IGRPTabsListPrimitive className="grid grid-cols-1">
                  <IGRPTabsTriggerPrimitive value="artifacts">
                    Process Artifacts
                  </IGRPTabsTriggerPrimitive>
                </IGRPTabsListPrimitive>

                <IGRPTabsContentPrimitive value="artifacts" className="space-y-6">
                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <h4 className="text-md font-medium">Process Artifacts</h4>
                      <p className="text-sm text-muted-foreground">
                        Artifacts for process: {selectedLocalProcess.name}{' '}
                        {lastVersion ? `(${lastVersion.name})` : ''}
                      </p>
                    </div>
                  </div>

                  <IGRPSeparator />

                  {artifacts.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {artifacts
                        .filter((artifact) => artifact.content?.type === 'processStep')
                        .map((artifact, index) => (
                          <IGRPCardPrimitive
                            key={`${artifact.path}-${index}`}
                            className="hover:shadow-md transition-all cursor-pointer hover:bg-muted/30"
                          >
                            <IGRPCardHeaderPrimitive>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <IGRPCardTitlePrimitive className="text-base font-medium">
                                    {artifact.content?.description}
                                  </IGRPCardTitlePrimitive>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {artifact.content?.taskKey}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end space-y-2">
                                  <IGRPBadgePrimitive variant="outline" className="text-xs">
                                    Local
                                  </IGRPBadgePrimitive>
                                </div>
                              </div>
                            </IGRPCardHeaderPrimitive>
                            <IGRPCardContentPrimitive className="space-y-2">
                              <IGRPButtonPrimitive
                                size="sm"
                                className="w-full"
                                variant="outline"
                                onClick={() => {
                                  const pageDefinition = convertFileTreeToPageDefinition(artifact)
                                  onPageClick?.(pageDefinition)
                                }}
                              >
                                <Component className="mr-2 h-4 w-4" />
                                Add Components
                              </IGRPButtonPrimitive>
                            </IGRPCardContentPrimitive>
                          </IGRPCardPrimitive>
                        ))}
                    </div>
                  ) : lastVersion ? (
                    <IGRPCardPrimitive>
                      <IGRPCardContentPrimitive className="py-8 text-center text-muted-foreground">
                        No artifacts found in {lastVersion.name}.
                      </IGRPCardContentPrimitive>
                    </IGRPCardPrimitive>
                  ) : (
                    <IGRPCardPrimitive>
                      <IGRPCardContentPrimitive className="py-8 text-center text-muted-foreground">
                        No versions found for this process.
                      </IGRPCardContentPrimitive>
                    </IGRPCardPrimitive>
                  )}
                </IGRPTabsContentPrimitive>
              </IGRPTabsPrimitive>
            </div>
          )
        })()}

      <GenerateNewStepForm
        open={showAddComponentsModal}
        onOpenChange={onShowAddComponentsModalChange}
        onConfirm={onConfirmStepProcess}
        defaultComponentName={pendingComponentData?.processArtifact?.taskKey || ''}
        defaultComponentDescription={pendingComponentData?.processArtifact?.name || ''}
        processFound={pendingComponentData?.processFound || oldProcessFound}
        bpmnProcesses={bpmnProcesses}
      />
    </div>
  )
}
