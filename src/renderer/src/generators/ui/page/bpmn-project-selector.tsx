import { useState, useEffect, JSX } from 'react'
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
  IGRPSeparator
} from '@igrp/igrp-framework-react-design-system'
import { RefreshCw, Settings } from 'lucide-react'
import { nanoid } from '@reduxjs/toolkit'
import { useDispatch } from 'react-redux'
import {
  BPMNProject,
  BPMNProjectProcessDefinition,
  BPMNProjectArtifact,
  FileTree
} from 'src/main/types'
import { bpmnService } from '@renderer/services/bpmn-service'
import {
  ProcessConfig,
  ProcessStepConfig
} from '@igrp/igrp-studio-nextjs-engine/types'
import { ENV_TYPES } from '@renderer/constants/appConstants'
import useToast from '@renderer/hooks/useToast'
import { getFileThree as onGetPages } from '@renderer/redux/thunks'
import { getId } from '@renderer/utils'
import { PageDefinition } from './page-manager'
import { BPMNDiagramViewer } from '@renderer/components/bpmn-diagram-viewer'
import { bpmnProcessStepInteractions } from './utils/bpmn-process-step-interactions'
import { AddComponentsNameModal } from './components/add-components-name-modal'
// Import refactored components and hooks
import { useBPMNProjects, useProcessDefinitions } from './hooks/useBPMNData'
import { findProcess, findStepProcess } from './utils/bpmn-helpers'
import { ProcessCard, ProcessArtifactCard } from './components'

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
  const [loadingProcessDetails, setLoadingProcessDetails] = useState(false)
  const [showAddComponentsModal, setShowAddComponentsModal] = useState(false)
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

  // Fetch process definition details when a process is selected
  useEffect(() => {
    setProcessDefinitionDetails(null)

    const fetchProcessDefinitionDetails = async (): Promise<void> => {
      if (selectedProcess?.processDefinitionId) {
        try {
          setLoadingProcessDetails(true)
          const details = await bpmnService.getProcessDefinitionDetails(
            selectedProcess.processDefinitionId
          )
          setProcessDefinitionDetails(details)
        } catch (error) {
          setProcessDefinitionDetails(null)
          console.error('Error fetching process definition details:', error)
          showErrorToast('Failed to fetch process definition details')
        } finally {
          setLoadingProcessDetails(false)
        }
      } else {
        setProcessDefinitionDetails(null)
      }
    }

    fetchProcessDefinitionDetails()
  }, [selectedProcess])

  const handleProjectChange = (projectId: string): void => {
    const project = projects.find((p) => p.projectId === projectId)
    setSelectedProject(project || null)
    setProcessDefinitionDetails(null)
    setSelectedProcess(null)
  }

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

      const version = `v${processDefinition.version || '1'}`

      if (!processFound) {
        const processConfig: ProcessConfig = {
          type: 'process',
          processKey: processDefinition.processKey || '',
          name: processDefinition.processKey || '',
          processVersion: version,
          description: processDefinition.title || '',
          steps: processDefinition.processArtifacts?.map((artifact) => ({
            id: artifact.taskKey || '',
            name: artifact.name || ''
          })),
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

      const processStep: ProcessStepConfig = {
        processKey: processDefinition.processKey || '',
        processVersion: version,
        version: version,
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

    // Store the data and open the modal
    setPendingComponentData({
      processDefinition,
      processArtifact,
      processFound: processFound as FileTree
    })
    setShowAddComponentsModal(true)
  }

  if (loading) {
    return <IGRPLoadingSpinner />
  }

  return (
    <div className="space-y-6">
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
            {loadingProcesses && <IGRPLoadingSpinner />}
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
          <IGRPLoadingSpinner />
        ) : processDefinitions.length > 0 ? (
          <div className="space-y-4">
            {loadingProcessDetails && (
              <div className="flex items-center justify-center py-4">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <IGRPLoadingSpinner />
                  <span>Loading process details...</span>
                </div>
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {processDefinitions.map((process) => (
                <ProcessCard
                  key={process.processDefinitionId}
                  process={process}
                  isSelected={selectedProcess?.processDefinitionId === process.processDefinitionId}
                  onSelectProcess={setSelectedProcess}
                />
              ))}
            </div>
          </div>
        ) : (
          <IGRPCardPrimitive>
            <IGRPCardContentPrimitive className="py-8 text-center text-muted-foreground">
              No process definitions found for this project.
            </IGRPCardContentPrimitive>
          </IGRPCardPrimitive>
        )}
      </div>

      {/* Step 3: Process Details with Tabs */}
      {selectedProcess && processDefinitions.length > 0 && (
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
                  <div className="flex space-x-2">
                    <IGRPButtonPrimitive
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      <Settings />
                      Bulk Actions
                    </IGRPButtonPrimitive>
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
                          selectedProcess,
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
          <IGRPCardContentPrimitive className="py-8 text-center text-muted-foreground">
            No projects found. Please check your BPMN API configuration.
          </IGRPCardContentPrimitive>
        </IGRPCardPrimitive>
      )}

      {/* Add Components Name Modal */}
      <AddComponentsNameModal
        open={showAddComponentsModal}
        onOpenChange={setShowAddComponentsModal}
        onConfirm={handleStepProcess}
        defaultComponentName={pendingComponentData?.processArtifact?.taskKey || ''}
        defaultName={pendingComponentData?.processArtifact?.name || ''}
        processFound={pendingComponentData?.processFound || oldProcessFound}
        bpmnProcesses={bpmnProcesses}
      />
    </div>
  )
}
