import { useState, useEffect, useRef, JSX } from 'react'
import {
  IGRPBadgePrimitive,
  IGRPButtonPrimitive,
  IGRPSelectContentPrimitive,
  IGRPSelectItemPrimitive,
  IGRPSelectPrimitive,
  IGRPSelectTriggerPrimitive,
  IGRPSelectValuePrimitive,
  IGRPTabsPrimitive,
  IGRPTabsContentPrimitive,
  IGRPTabsListPrimitive,
  IGRPTabsTriggerPrimitive,
  IGRPCardPrimitive,
  IGRPCardContentPrimitive,
  IGRPLoadingSpinner,
  IGRPSeparator,
  IGRPToggleGroupPrimitive,
  IGRPToggleGroupItemPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { RefreshCw, Cloud, HardDrive } from 'lucide-react'
import { nanoid } from '@reduxjs/toolkit'
import { useDispatch } from 'react-redux'
import {
  BPMNProject,
  BPMNProjectProcessDefinition,
  BPMNProjectArtifact,
  FileTree
} from 'src/main/types'
import { bpmnService } from '@renderer/services/bpmn-service'
import { ProcessConfig, ProcessStepConfig } from '@igrp/igrp-studio-nextjs-engine/types'
import { ENV_TYPES } from '@renderer/constants/appConstants'
import useToast from '@renderer/hooks/useToast'
import { getFileThree as onGetPages } from '@renderer/redux/thunks'
import { getId } from '@renderer/utils'
import { PageDefinition } from './page-manager'
import { BPMNDiagramViewer } from '@renderer/components/bpmn-diagram-viewer'
import { bpmnProcessStepInteractions } from './utils/bpmn-process-step-interactions'
import { GenerateNewStepForm } from './components/generate-new-step-form'
// Import refactored components and hooks
import { useBPMNProjects, useProcessDefinitions } from './hooks/useBPMNData'
import { findProcess, findStepProcess } from './utils/bpmn-helpers'
import { ProcessCard, ProcessArtifactCard } from './components'
import { BpmnLocalView } from './components/bpmn-local-view'
import { SearchInput } from '@renderer/components/shared-ui'
import { EmptyList } from '@renderer/components/empty-list'
import {
  getKeyFromFormKey,
  getNormalizeClassNameFromFormKey,
  getVersionFromFormKey
} from './utils/form-key-utils'
import { CopyLegacyVersionModal } from './components/copy-legacy-version'

// Types
interface BPMNProjectSelectorProps {
  onPageClick?: (pageDefinition: PageDefinition) => void
  bpmnProcesses: FileTree[]
  basePath: string
}

// Main Component
export const BPMNProjectSelector = ({
  onPageClick,
  bpmnProcesses,
  basePath
}: BPMNProjectSelectorProps): JSX.Element => {
  const [selectedProject, setSelectedProject] = useState<BPMNProject | null>(null)
  const [selectedProcess, setSelectedProcess] = useState<BPMNProjectProcessDefinition | null>(null)
  const [processDefinitionDetails, setProcessDefinitionDetails] =
    useState<BPMNProjectProcessDefinition | null>(null)
  const lastFetchedProcessIdRef = useRef<string | null>(null)
  const [showAddComponentsModal, setShowAddComponentsModal] = useState(false)
  const [showCopyLegacyVersionModal, setShowCopyLegacyVersionModal] = useState(false)
  const [pendingComponentData, setPendingComponentData] = useState<
    | {
      processDefinition: BPMNProjectProcessDefinition
      processArtifact: BPMNProjectArtifact
      processFound: FileTree
    }
    | undefined
  >(undefined)
  const [oldProcessFound, setOldProcessFound] = useState<FileTree | undefined>(undefined)
  const [activeTab, setActiveTab] = useState<string>('artifacts')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [processFilter, setProcessFilter] = useState<string>('')
  const [selectedLocalProcess, setSelectedLocalProcess] = useState<FileTree | null>(null)
  const [viewMode, setViewMode] = useState<'local' | 'remote'>('remote')

  const { projects, loading } = useBPMNProjects(refreshTrigger)
  const {
    processDefinitions,
    loading: loadingProcesses,
    loadProcessDefinitions
  } = useProcessDefinitions(selectedProject)

  const { showErrorToast, showSuccessToast } = useToast()
  const dispatch: any = useDispatch()

  // Listen for configuration changes and refresh projects
  useEffect(() => {
    const handleConfigChange = (): void => {
      // Clear the BPMN service cache to force it to use the new active config
      bpmnService.clearConfig()
      setRefreshTrigger((prev) => prev + 1)
    }

    // Listen for storage changes (when BPMN configs are updated)
    const handleStorageChange = (e: StorageEvent): void => {
      if (e.key?.includes('bpmn') || e.key?.includes('BPMN')) {
        handleConfigChange()
      }
    }

    // Listen for custom events (if the app uses them for config changes)
    window.addEventListener('bpmn-config-changed', handleConfigChange)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('bpmn-config-changed', handleConfigChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // Load saved project preference when projects are loaded
  useEffect(() => {
    const loadSavedProject = async (): Promise<void> => {
      if (!loading && projects.length > 0) {
        try {
          const savedProjectId = await window.igrpStudioSettings.getSelectedBPMNProject()
          if (savedProjectId) {
            const project = projects.find((p) => p.projectId === savedProjectId)
            if (project) {
              setSelectedProject(project)
            }
          }
        } catch (error) {
          console.error('Error loading saved BPMN project preference:', error)
        }
      }
    }

    loadSavedProject()
  }, [projects, loading])

  // Load saved process preference when process definitions are loaded
  useEffect(() => {
    const loadSavedProcess = async (): Promise<void> => {
      // Only load if we don't already have a selected process
      if (
        !loadingProcesses &&
        processDefinitions.length > 0 &&
        selectedProject &&
        !selectedProcess
      ) {
        try {
          const savedProcessDefinitionId = await window.igrpStudioSettings.getSelectedBPMNProcess()
          if (savedProcessDefinitionId) {
            const process = processDefinitions.find(
              (p) => p.processDefinitionId === savedProcessDefinitionId
            )
            if (process) {
              setSelectedProcess(process)
            }
          }
        } catch (error) {
          console.error('Error loading saved BPMN process preference:', error)
        }
      }
    }

    loadSavedProcess()
  }, [processDefinitions, loadingProcesses, selectedProject, selectedProcess])

  // Fetch process definition details when a process is selected
  useEffect(() => {
    const currentProcessId = selectedProcess?.processDefinitionId

    if (!currentProcessId) {
      // Clear details when no process is selected
      lastFetchedProcessIdRef.current = null
      if (processDefinitionDetails) {
        // Use setTimeout to avoid synchronous setState warning
        setTimeout(() => setProcessDefinitionDetails(null), 0)
      }
      return
    }

    // Don't fetch if we already fetched details for this process
    if (lastFetchedProcessIdRef.current === currentProcessId) {
      return
    }

    let isCancelled = false
    lastFetchedProcessIdRef.current = currentProcessId

    const fetchProcessDefinitionDetails = async (): Promise<void> => {
      try {
        const details = await bpmnService.getProcessDefinitionDetails(currentProcessId)

        // Only update if the process hasn't changed and effect hasn't been cancelled
        if (!isCancelled && selectedProcess?.processDefinitionId === currentProcessId) {
          setProcessDefinitionDetails(details)
        }
      } catch (error) {
        // Only update if the process hasn't changed and effect hasn't been cancelled
        if (!isCancelled && selectedProcess?.processDefinitionId === currentProcessId) {
          lastFetchedProcessIdRef.current = null
          setProcessDefinitionDetails(null)
          console.error('Error fetching process definition details:', error)
          showErrorToast('Failed to fetch process definition details')
        }
      }
    }

    fetchProcessDefinitionDetails()

    return () => {
      isCancelled = true
      // Don't reset the ref here, only reset on error or when process changes
    }
  }, [selectedProcess?.processDefinitionId, showErrorToast])

  const handleProjectChange = async (projectId: string): Promise<void> => {
    const project = projects.find((p) => p.projectId === projectId)
    setSelectedProject(project || null)
    lastFetchedProcessIdRef.current = null
    setProcessDefinitionDetails(null)
    setSelectedProcess(null)

    // Save the selected project preference
    try {
      await window.igrpStudioSettings.setSelectedBPMNProject(projectId)
    } catch (error) {
      console.error('Error saving BPMN project preference:', error)
    }
  }

  const handleProcessChange = async (process: BPMNProjectProcessDefinition): Promise<void> => {
    setSelectedProcess(process)

    // Save the selected process preference
    try {
      await window.igrpStudioSettings.setSelectedBPMNProcess(process.processDefinitionId)
    } catch (error) {
      console.error('Error saving BPMN process preference:', error)
    }
  }

  /*
   *
   * This function is used to create a new process step
   * It is used to create a new process step from a BPMN process
   *
   * @param componentDescription - The description of the component
   * @param componentName - The name of the component
   * @param previousComponent - The previous component
   * @returns void
   */
  const handleStepProcess = async (
    componentDescription: string,
    componentName: string,
    previousComponent?: ProcessStepConfig
  ): Promise<void> => {
    try {
      if (!pendingComponentData) return

      // Validate inputs
      if (!componentName || !componentDescription) {
        showErrorToast('Component name and description are required')
        return
      }

      const { processDefinition, processArtifact, processFound } = pendingComponentData

      if (!processArtifact?.taskKey) {
        showErrorToast('Process artifact task key is missing')
        return
      }

      if (!processFound) {
        const processConfig: ProcessConfig = {
          type: 'process',
          processKey: processDefinition.processKey || '',
          name: processDefinition.processKey || '',
          processVersion: processDefinition.version?.toString() || '',
          description: processDefinition.title || '',
          steps: processDefinition.processArtifacts?.map((artifact) => {
            const key = getKeyFromFormKey(artifact.formKey)
            const name = getNormalizeClassNameFromFormKey(artifact.formKey)

            return {
              id: getId(),
              key: key,
              name: name
            }
          }),
          id: getId()
        }

        const { error } = await window.engine.createProcess(
          processConfig,
          ENV_TYPES.NEXTJS,
          basePath
        )

        if (error) {
          console.log('processConfig error', error)
          showErrorToast(error)
        }
      }

      const key = getKeyFromFormKey(processArtifact.formKey)
      const version = getVersionFromFormKey(processArtifact.formKey)

      const processStep: ProcessStepConfig = {
        key: key,
        processKey: processDefinition.processKey || '',
        processVersion: processDefinition.version?.toString() || '',
        version: version || '1',
        name: componentName,
        type: 'processStep',
        description: componentDescription,
        id: getId(),
        forceDynamic: false,
        types: previousComponent ? previousComponent.types : [],
        imports: previousComponent ? previousComponent.imports : [],
        states: previousComponent ? previousComponent.states : [],
        references: [],
        functions: previousComponent ? previousComponent.functions : [],
        projectArtifactId: '',
        taskKey: processArtifact.taskKey,
        artifactVariables: [],
        components: previousComponent
          ? previousComponent.components
          : {
            id: `processstep_${componentName}`,
            componentName: 'processStep',
            label: 'Process Step',
            properties: {
              variables: [],
              commonProperties: {}
            },
            children: [],
            tag: `processStep_${nanoid()}`,
            data: {},
            interactions: bpmnProcessStepInteractions
          }
      }

      console.log('basePath', basePath)

      const { error } = await window.engine.createProcessStep(
        processStep,
        ENV_TYPES.NEXTJS,
        basePath
      )

      if (error) {
        console.log('error', error)
        showErrorToast(error)
      } else {
        showSuccessToast('Process step created successfully')
        dispatch(onGetPages(basePath))
      }
    } catch (error) {
      console.error('Error loading process definition:', error)
    }
  }

  const handleModalConfiguration = async (
    processDefinition: BPMNProjectProcessDefinition,
    processArtifact: BPMNProjectArtifact
  ): Promise<void> => {
    const processFound = findProcess(processDefinition, bpmnProcesses)

    if (!processFound) {
      const oldProcess = findProcess(processDefinition, bpmnProcesses)
      setOldProcessFound(oldProcess)
    }
    const newProcessArtifact = {
      ...processArtifact,
      name: getNormalizeClassNameFromFormKey(processArtifact.formKey),
      description: processArtifact.name
    }

    console.log(newProcessArtifact)
    // Store the data and open the modal
    setPendingComponentData({
      processDefinition,
      processArtifact: newProcessArtifact,
      processFound: processFound as FileTree
    })

    setShowAddComponentsModal(true)
  }

  const handleCopyFromLegacyVersion = async (
    processDefinition: BPMNProjectProcessDefinition,
    processArtifact: BPMNProjectArtifact
  ): Promise<void> => {
    const processFound = findProcess(processDefinition, bpmnProcesses)

    if (!processFound) {
      const oldProcess = findProcess(processDefinition, bpmnProcesses)
      setOldProcessFound(oldProcess)
    }

    // Store the data and open the modal
    setPendingComponentData({
      processDefinition,
      processArtifact,
      processFound: processFound as FileTree
    })
    setShowCopyLegacyVersionModal(true)
  }

  // Filter processes based on search input
  const filteredProcesses = processDefinitions.filter((process) => {
    if (!processFilter.trim()) return true
    const filterLower = processFilter.toLowerCase()
    return (
      process.processKey?.toLowerCase().includes(filterLower) ||
      process.title?.toLowerCase().includes(filterLower)
    )
  })

  if (loading) {
    return <IGRPLoadingSpinner />
  }

  // Show local processes when no API connection is available or user chooses local mode
  const hasApiProjects = projects.length > 0
  const hasLocalProcesses = bpmnProcesses.length > 0

  // Determine which view to show based on user preference and data availability
  const shouldShowLocalView = viewMode === 'local'

  if (shouldShowLocalView) {
    return (
      <BpmnLocalView
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        processFilter={processFilter}
        onProcessFilterChange={setProcessFilter}
        selectedLocalProcess={selectedLocalProcess}
        onSelectedLocalProcessChange={setSelectedLocalProcess}
        activeTab={activeTab}
        onActiveTabChange={setActiveTab}
        bpmnProcesses={bpmnProcesses}
        hasApiProjects={hasApiProjects}
        onPageClick={onPageClick}
        showAddComponentsModal={showAddComponentsModal}
        onShowAddComponentsModalChange={setShowAddComponentsModal}
        pendingComponentData={pendingComponentData}
        oldProcessFound={oldProcessFound}
        onConfirmStepProcess={handleStepProcess}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">View Mode:</span>
          <IGRPToggleGroupPrimitive
            type="single"
            value={viewMode}
            onValueChange={(value) => {
              if (value) setViewMode(value as 'local' | 'remote')
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

      {/* Project Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Select Project</label>
          <IGRPButtonPrimitive
            variant="outline"
            size="sm"
            onClick={() => {
              bpmnService.clearConfig()
              setRefreshTrigger((prev) => prev + 1)
            }}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </IGRPButtonPrimitive>
        </div>
        <IGRPSelectPrimitive
          onValueChange={handleProjectChange}
          value={selectedProject?.projectId || ''}
        >
          <IGRPSelectTriggerPrimitive className="w-full">
            <IGRPSelectValuePrimitive placeholder="Choose a project..." />
          </IGRPSelectTriggerPrimitive>
          <IGRPSelectContentPrimitive>
            {projects.length > 0 &&
              projects.map((project) => (
                <IGRPSelectItemPrimitive key={project.projectId} value={project.projectId}>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{project.name}</span>
                    <IGRPBadgePrimitive variant={project.active ? 'default' : 'secondary'}>
                      {project.code}
                    </IGRPBadgePrimitive>
                    {!project.active && (
                      <IGRPBadgePrimitive variant="outline">Inactive</IGRPBadgePrimitive>
                    )}
                  </div>
                </IGRPSelectItemPrimitive>
              ))}
          </IGRPSelectContentPrimitive>
        </IGRPSelectPrimitive>
      </div>

      {/* Step 2: Select Process */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Select Process</h3>
            <p className="text-sm text-muted-foreground">
              Choose a specific process to view its artifacts, or load all project artifacts below.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <SearchInput
              placeholder="Filter by process key or name..."
              value={processFilter}
              onChange={(value) => setProcessFilter(value)}
              className="lg:w-[250px]"
            />
            <IGRPButtonPrimitive
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => selectedProject && loadProcessDefinitions(selectedProject.projectId)}
              title="Refresh processes"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </IGRPButtonPrimitive>
          </div>
        </div>

        {loadingProcesses ? (
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <IGRPLoadingSpinner />
            <span>Loading process details...</span>
          </div>
        ) : filteredProcesses.length > 0 ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {filteredProcesses.map((process) => (
                <ProcessCard
                  key={process.processDefinitionId}
                  process={process}
                  isSelected={selectedProcess?.processDefinitionId === process.processDefinitionId}
                  onSelectProcess={handleProcessChange}
                />
              ))}
            </div>
          </div>
        ) : processDefinitions.length === 0 ? (
          <EmptyList
            title="No process definitions found"
            description="No process definitions found for this project. Please check your BPMN API configuration or try refreshing."
          />
        ) : (
          <EmptyList
            title="No processes match your filter"
            description={`No processes match "${processFilter}". Try adjusting your search terms.`}
          />
        )}
      </div>

      {/* Step 3: Process Details with Tabs */}
      {selectedProcess && (
        <>
          <div className="space-y-4">
            <IGRPTabsPrimitive value={activeTab} onValueChange={setActiveTab} className="w-full">
              <IGRPTabsListPrimitive className="grid grid-cols-2">
                <IGRPTabsTriggerPrimitive value="artifacts">
                  Process Artifacts
                </IGRPTabsTriggerPrimitive>
                <IGRPTabsTriggerPrimitive value="diagram">BPMN Diagram</IGRPTabsTriggerPrimitive>
              </IGRPTabsListPrimitive>

              <IGRPTabsContentPrimitive value="artifacts" className="space-y-6">
                <div className="flex items-center justify-between mt-4">
                  <div>
                    <h4 className="text-md font-medium">Process Artifacts</h4>
                    <p className="text-sm text-muted-foreground">
                      Artifacts for process: {selectedProcess.title}
                    </p>
                  </div>
                </div>

                <IGRPSeparator />

                {processDefinitionDetails &&
                  processDefinitionDetails.processArtifacts &&
                  processDefinitionDetails.processArtifacts.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {processDefinitionDetails.processArtifacts.map(
                      (artifact: BPMNProjectArtifact, index: number) => {
                        const processFound = findProcess(selectedProcess, bpmnProcesses)

                        const stepProcessFound = findStepProcess(
                          processFound as FileTree,
                          artifact
                        )

                        return (
                          <ProcessArtifactCard
                            key={index}
                            artifact={artifact}
                            selectedProcess={selectedProcess}
                            stepProcessFound={stepProcessFound}
                            onPageClick={onPageClick}
                            onRegenerateStep={handleModalConfiguration}
                            onCopyFromLegacyVersion={handleCopyFromLegacyVersion}
                          />
                        )
                      }
                    )}
                  </div>
                ) : (
                  <IGRPCardPrimitive>
                    <IGRPCardContentPrimitive className="py-8 text-center text-muted-foreground">
                      No artifacts found for this process.
                    </IGRPCardContentPrimitive>
                  </IGRPCardPrimitive>
                )}
              </IGRPTabsContentPrimitive>

              <IGRPTabsContentPrimitive value="diagram" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-md font-medium">BPMN Diagram</h4>
                    <p className="text-sm text-muted-foreground">
                      Visual representation of process: {selectedProcess.title}
                    </p>
                  </div>
                </div>

                {processDefinitionDetails?.bpmFileContent && (
                  <BPMNDiagramViewer bpmnContent={processDefinitionDetails.bpmFileContent} />
                )}
              </IGRPTabsContentPrimitive>
            </IGRPTabsPrimitive>
          </div>
        </>
      )}

      {/* No Projects Message */}
      {!loading && projects.length === 0 && (
        <IGRPCardPrimitive>
          <IGRPCardContentPrimitive className="py-8 text-center">
            <div className="flex flex-col items-center space-y-3">
              <p className="text-muted-foreground">
                No projects found. Please check your BPMN API configuration.
              </p>
              {hasLocalProcesses && (
                <p className="text-sm text-muted-foreground">
                  Or switch to <strong>Local</strong> mode to view your locally generated processes.
                </p>
              )}
            </div>
          </IGRPCardContentPrimitive>
        </IGRPCardPrimitive>
      )}

      {/* Add Components Name Modal */}
      <GenerateNewStepForm
        open={showAddComponentsModal}
        onOpenChange={setShowAddComponentsModal}
        onConfirm={handleStepProcess}
        defaultComponentName={pendingComponentData?.processArtifact?.name || ''}
        defaultComponentDescription={pendingComponentData?.processArtifact?.description || ''}
        processFound={pendingComponentData?.processFound || oldProcessFound}
        bpmnProcesses={bpmnProcesses}
      />

      <CopyLegacyVersionModal
        open={showCopyLegacyVersionModal}
        onOpenChange={setShowCopyLegacyVersionModal}
        onConfirm={handleStepProcess}
        processFound={pendingComponentData?.processFound || oldProcessFound}
        bpmnProcesses={bpmnProcesses}
      />
    </div>
  )
}
