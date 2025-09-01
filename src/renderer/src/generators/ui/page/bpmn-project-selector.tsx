import { useState, useEffect } from 'react';
import { Button } from '@renderer/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@renderer/components/ui/select';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@renderer/components/ui/tabs';

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@renderer/components/ui/card';
import { Badge } from '@renderer/components/ui/badge';
import { toast } from 'sonner';
import {
    BPMNProject,
    BPMNProjectProcessDefinition,
    BPMNProjectArtifact,
    FileTree,
} from 'src/main/types';
import { bpmnService } from '@renderer/services/bpmn-service';
import {
    ProcessConfig,
    ProcessStepConfig,
} from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { ENV_TYPES } from '@renderer/constants/appConstants';
import useToast from '@renderer/hooks/useToast';
import { useDispatch } from 'react-redux';
import { getFileThree as onGetPages } from '@renderer/redux/thunks';
import { getId } from '@renderer/utils';
import { Component, EllipsisVertical, Settings, Wrench } from 'lucide-react';
import { AddComponentsNameModal } from './add-components-name-modal';
import {
    IGRPLoadingSpinner,
    IGRPSeparator,
} from '@igrp/igrp-framework-react-design-system';
import { nanoid } from '@reduxjs/toolkit';
import { PageDefinition } from './page-manager';
import { BPMNDiagramViewer } from '@renderer/components/bpmn-diagram-viewer';

// Types
interface BPMNProjectSelectorProps {
    onPageClick?: (pageDefinition: PageDefinition) => void;
    bpmnProcesses: FileTree[];
    basePath: string;
}

interface ProcessCardProps {
    process: BPMNProjectProcessDefinition;
    isSelected: boolean;
    onSelectProcess: (process: BPMNProjectProcessDefinition) => void;
}

// Custom Hooks
const useBPMNProjects = () => {
    const [projects, setProjects] = useState<BPMNProject[]>([]);
    const [loading, setLoading] = useState(true);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const projectsData = await bpmnService.getProjects();
            setProjects(projectsData);
        } catch (error) {
            toast.error('Failed to load projects');
            console.error('Error loading projects:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProjects();
    }, []);

    return { projects, loading, loadProjects };
};

const useProcessDefinitions = (selectedProject: BPMNProject | null) => {
    const [processDefinitions, setProcessDefinitions] = useState<
        BPMNProjectProcessDefinition[]
    >([]);
    const [loading, setLoading] = useState(false);

    const loadProcessDefinitions = async (projectId: string) => {
        try {
            setLoading(true);
            const processes =
                await bpmnService.getProcessDefinitionsByProject(projectId);
            setProcessDefinitions(processes);
        } catch (error) {
            toast.error('Failed to load process definitions');
            console.error('Error loading process definitions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedProject) {
            loadProcessDefinitions(selectedProject.projectId);
        } else {
            setProcessDefinitions([]);
        }
    }, [selectedProject]);

    return { processDefinitions, loading, loadProcessDefinitions };
};

const ProcessCard = ({
    process,
    isSelected,
    onSelectProcess,
}: ProcessCardProps & {
    isSelected: boolean;
    onSelectProcess: (process: BPMNProjectProcessDefinition) => void;
}) => {
    return (
        <Card
            className={`hover:shadow-md transition-all cursor-pointer ${
                isSelected ? 'ring-2 ring-primary ' : 'hover:bg-muted/30'
            }`}
            onClick={() => {
                console.log('Process clicked:', process.processDefinitionId);
                onSelectProcess(process);
            }}
        >
            <CardContent>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-base font-medium">
                            {process.title}
                        </CardTitle>
                        <div className="flex items-center space-x-2 mt-2 text-sm text-muted-foreground">
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                            </svg>
                            {process.deploymentDate && (
                                <span>
                                    Deployed on{' '}
                                    {new Date(
                                        process.deploymentDate || ''
                                    ).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1 text-sm text-muted-foreground">
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                            </svg>
                            <span>
                                {process.projectArtifacts?.length || 0}{' '}
                                artifacts
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                        <Badge variant={'outline'}>
                            v{process.version || 'N/A'}
                            {' • Published'}
                        </Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// Main Component
export const BPMNProjectSelector = ({
    onPageClick,
    bpmnProcesses,
    basePath,
}: BPMNProjectSelectorProps) => {
    const [selectedProject, setSelectedProject] = useState<BPMNProject | null>(
        null
    );
    const [selectedProcess, setSelectedProcess] =
        useState<BPMNProjectProcessDefinition | null>(null);
    const [processDefinitionDetails, setProcessDefinitionDetails] =
        useState<any>(null);
    const [loadingProcessDetails, setLoadingProcessDetails] = useState(false);
    const [showAddComponentsModal, setShowAddComponentsModal] = useState(false);
    const [pendingComponentData, setPendingComponentData] = useState<{
        processDefinition: BPMNProjectProcessDefinition;
        processArtifact: BPMNProjectArtifact;
        processFound: FileTree;
    } | undefined>(undefined);
    const [oldProcessFound, setOldProcessFound] = useState<FileTree | undefined>(undefined);
    const [activeTab, setActiveTab] = useState<string>('artifacts');

    const { projects, loading } = useBPMNProjects();
    const { processDefinitions, loading: loadingProcesses } =
        useProcessDefinitions(selectedProject);

    const { showErrorToast, showSuccessToast } = useToast();
    const dispatch: any = useDispatch();

    // Fetch process definition details when a process is selected
    useEffect(() => {
        const fetchProcessDefinitionDetails = async () => {
            if (selectedProcess?.processDefinitionId) {
                try {
                    setLoadingProcessDetails(true);
                    const details =
                        await bpmnService.getProcessDefinitionDetails(
                            selectedProcess.processDefinitionId
                        );
                    setProcessDefinitionDetails(details);
                    console.log('Process definition details:', details);
                } catch (error) {
                    console.error(
                        'Error fetching process definition details:',
                        error
                    );
                    showErrorToast(
                        'Failed to fetch process definition details'
                    );
                } finally {
                    setLoadingProcessDetails(false);
                }
            } else {
                setProcessDefinitionDetails(null);
            }
        };

        fetchProcessDefinitionDetails();
    }, [selectedProcess]);

    const handleProjectChange = (projectId: string) => {
        const project = projects.find((p) => p.projectId === projectId);
        setSelectedProject(project || null);
    };

    const findProcess = (processDefinition: BPMNProjectProcessDefinition) => {
        return bpmnProcesses.find(
            (p) =>
                p.name === processDefinition.processKey &&
                p.children?.some(
                    (c: any) => c.name === `v${processDefinition.version}`
                )
        );
    };

    const findProcessRecursive = (processDefinition: BPMNProjectProcessDefinition) => {
        // Find the process by name
        const process = bpmnProcesses.find((p) => p.name === processDefinition.processKey);
        if (!process || !process.children) {
            return undefined;
        }

        // Start from the current version and go backwards to find the first available version
        let currentVersion = processDefinition.version || 1;
        
        while (currentVersion >= 1) {
            const versionName = `v${currentVersion}`;
            const versionFound = process.children.find((c: any) => c.name === versionName);
            
            if (versionFound) {
                return process;
            }
            
            currentVersion--;
        }
        
        // If no version found, return the process anyway (for first-time creation)
        return process;
    };

    const findStepProcess = (
        processDefinition: BPMNProjectProcessDefinition,
        processFound: any,
        processArtifact: BPMNProjectArtifact
    ) => {
        const processVersionFound = processFound?.children?.find(
            (c: any) => c.name === `v${processDefinition.version}`
        );

        if (!processVersionFound) return;

        return processVersionFound?.children.find(
            (c: any) => c.content.taskKey === processArtifact.taskKey
        );
    };

    const handleStepProcess = async (
        componentDescription: string,
        componentName: string,
        previousComponent?: any
    ) => {
        try {
            if (!pendingComponentData) return;

            const { processDefinition, processArtifact, processFound } =
                pendingComponentData;

            const version = `v${processDefinition.version}` || 'v1';

            if (!processFound) {
                const processConfig: ProcessConfig = {
                    type: 'process',
                    processKey: processDefinition.processKey,
                    name: processDefinition.processKey,
                    processVersion: version,
                    description: processDefinition.title,
                    steps: processDefinition.projectArtifacts?.map(
                        (artifact) => ({
                            id: artifact.taskKey,
                            name: artifact.name,
                        })
                    ),
                    id: getId(),
                };

                const { error } = await window.engine.createProcess(
                    processConfig,
                    ENV_TYPES.NEXTJS,
                    basePath
                );

                if (error) showErrorToast(error);
            }

            const processStep: ProcessStepConfig = {
                processKey: processDefinition.processKey,
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
                              commonProperties: {},
                          },
                          children: [],
                          tag: `processStep_${nanoid()}`,
                          data: {},
                          interactions: {
                              onLoad: {
                                  type: 'function',
                                  function: {
                                      type: 'function',
                                  },
                                  action: {},
                              },
                          },
                      },
            };

            const { error } = await window.engine.createProcessStep(
                processStep,
                ENV_TYPES.NEXTJS,
                basePath
            );

            if (error) {
                showErrorToast(error);
            } else {
                showSuccessToast('Process step created successfully');
                dispatch(onGetPages(basePath));
            }
        } catch (error) {
            console.error('Error loading process definition:', error);
        }
    };

    const handleModalConfiguration = async (
        processDefinition: BPMNProjectProcessDefinition,
        processArtifact: BPMNProjectArtifact
    ) => {
        const processFound = findProcess(processDefinition);

        if (!processFound) {
            const processFound = findProcessRecursive(processDefinition);
            setOldProcessFound(processFound as FileTree);
        }

        // Store the data and open the modal
        setPendingComponentData({
            processDefinition,
            processArtifact,
            processFound: processFound as FileTree,
        });
        setShowAddComponentsModal(true);
    };

    const handleConfirmAddComponents = (stepProcessFound: PageDefinition) => {
        onPageClick?.(stepProcessFound);
    };

    if (loading) {
        return <IGRPLoadingSpinner />;
    }

    return (
        <div className="space-y-6">
            {/* Project Selection */}
            <div className="space-y-2 flex flex-col">
                <label className="text-sm font-medium">Select Project</label>
                <Select
                    onValueChange={handleProjectChange}
                    value={selectedProject?.projectId || ''}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a project..." />
                    </SelectTrigger>
                    <SelectContent>
                        {projects.length > 0 &&
                            projects.map((project) => (
                                <SelectItem
                                    key={project.projectId}
                                    value={project.projectId}
                                >
                                    <div className="flex items-center space-x-2">
                                        <span className="font-medium">
                                            {project.name}
                                        </span>
                                        <Badge
                                            variant={
                                                project.active
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            {project.code}
                                        </Badge>
                                        {!project.active && (
                                            <Badge variant="outline">
                                                Inactive
                                            </Badge>
                                        )}
                                    </div>
                                </SelectItem>
                            ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Step 2: Select Process */}
            {selectedProject && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">
                                Select Process
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Choose a specific process to view its artifacts,
                                or load all project artifacts below.
                            </p>
                        </div>
                        {loadingProcesses && <IGRPLoadingSpinner />}
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
                                        isSelected={
                                            selectedProcess?.processDefinitionId ===
                                            process.processDefinitionId
                                        }
                                        onSelectProcess={setSelectedProcess}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="py-8 text-center text-muted-foreground">
                                No process definitions found for this project.
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Step 3: Process Details with Tabs */}
            {selectedProcess && (
                <>
                    <div className="space-y-4">
                        <Tabs
                            value={activeTab}
                            onValueChange={setActiveTab}
                            className="w-full"
                        >
                            <TabsList className="grid grid-cols-2">
                                <TabsTrigger value="artifacts">
                                    Process Artifacts
                                </TabsTrigger>
                                <TabsTrigger value="diagram">
                                    BPMN Diagram
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent
                                value="artifacts"
                                className="space-y-6"
                            >
                                <div className="flex items-center justify-between mt-4">
                                    <div>
                                        <h4 className="text-md font-medium">
                                            Process Artifacts
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            Artifacts for process:{' '}
                                            {selectedProcess.title}
                                        </p>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex items-center space-x-2"
                                        >
                                            <Settings />
                                            Bulk Actions
                                        </Button>
                                    </div>
                                </div>

                                <IGRPSeparator />

                                {processDefinitionDetails &&
                                processDefinitionDetails.projectArtifacts
                                    .length > 0 ? (
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                        {processDefinitionDetails.projectArtifacts.map(
                                            (artifact: BPMNProjectArtifact, index: number) => {
                                                const processFound =
                                                    findProcess(
                                                        selectedProcess
                                                    );

                                                const stepProcessFound =
                                                    findStepProcess(
                                                        selectedProcess,
                                                        processFound,
                                                        artifact
                                                    );

                                                return (
                                                    <Card
                                                        key={index}
                                                        className="hover:shadow-md transition-all cursor-pointer hover:bg-muted/30"
                                                    >
                                                        <CardHeader className="pb-3">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <CardTitle className="text-base font-medium">
                                                                        {
                                                                            artifact.name
                                                                        }
                                                                    </CardTitle>
                                                                    <div className="text-sm text-muted-foreground mt-1">
                                                                        {
                                                                            artifact.taskKey
                                                                        }
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col items-end space-y-2">
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="text-xs"
                                                                    >
                                                                        v
                                                                        {selectedProcess.version ||
                                                                            'N/A'}
                                                                    </Badge>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-6 w-6 p-0"
                                                                    >
                                                                        <EllipsisVertical />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <Button
                                                                size="sm"
                                                                className="w-full"
                                                                variant={
                                                                    stepProcessFound
                                                                        ? 'outline'
                                                                        : 'default'
                                                                }
                                                                onClick={() => {
                                                                    stepProcessFound
                                                                        ? handleConfirmAddComponents(
                                                                              stepProcessFound
                                                                          )
                                                                        : handleModalConfiguration(
                                                                              selectedProcess,
                                                                              artifact
                                                                          );
                                                                }}
                                                            >
                                                                {stepProcessFound ? (
                                                                    <>
                                                                        <Component />
                                                                        Add
                                                                        Components
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Wrench />
                                                                        Generate
                                                                        Step
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </CardContent>
                                                    </Card>
                                                );
                                            }
                                        )}
                                    </div>
                                ) : (
                                    <Card>
                                        <CardContent className="py-8 text-center text-muted-foreground">
                                            No artifacts found for this process.
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            <TabsContent value="diagram" className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-md font-medium">
                                            BPMN Diagram
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            Visual representation of process:{' '}
                                            {selectedProcess.title}
                                        </p>
                                    </div>
                                </div>

                                {processDefinitionDetails?.bpmFileContent && (
                                    <BPMNDiagramViewer
                                        bpmnContent={
                                            processDefinitionDetails.bpmFileContent
                                        }
                                    />
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                </>
            )}

            {/* No Projects Message */}
            {!loading && projects.length === 0 && (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        No projects found. Please check your BPMN API
                        configuration.
                    </CardContent>
                </Card>
            )}

            {/* Add Components Name Modal */}
            <AddComponentsNameModal
                open={showAddComponentsModal}
                onOpenChange={setShowAddComponentsModal}
                onConfirm={handleStepProcess}
                defaultComponentName={
                    pendingComponentData?.processArtifact?.taskKey || ''
                }
                defaultName={pendingComponentData?.processArtifact?.name || ''}
                processFound={pendingComponentData?.processFound || oldProcessFound}
            />
        </div>
    );
};
