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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@renderer/components/ui/card';
import { Badge } from '@renderer/components/ui/badge';
import { Separator } from '@renderer/components/ui/separator';
import { toast } from 'sonner';
import {
    BPMNProject,
    BPMNProjectProcessDefinition,
    BPMNPageDefinition,
    BPMNProjectArtifact,
} from 'src/main/types';
import { bpmnService } from '@renderer/services/bpmn-service';
import { ProcessConfig } from '@igrp/igrp-studio-nextjs-engine/dist/interfaces/types';
import { ENV_TYPES } from '@renderer/constants/appConstants';
import { generateId, getId } from '@renderer/utils';

interface BPMNProjectSelectorProps {
    onPageClick?: (pageDefinition: BPMNPageDefinition) => void;
    bpmnProcesses: any[];
    basePath: string;
}

export const BPMNProjectSelector = ({
    onPageClick,
    bpmnProcesses,
    basePath,
}: BPMNProjectSelectorProps) => {
    const [projects, setProjects] = useState<BPMNProject[]>([]);
    const [selectedProject, setSelectedProject] = useState<BPMNProject | null>(
        null
    );
    const [processDefinitions, setProcessDefinitions] = useState<
        BPMNProjectProcessDefinition[]
    >([]);
    const [loading, setLoading] = useState(true);
    const [loadingProcesses, setLoadingProcesses] = useState(false);

    // Load projects on component mount
    useEffect(() => {
        loadProjects();
    }, []);

    // check if  processs key is prresent in bmpmtrpocess storage chekc name and version

    // Load process definitions when project changes
    useEffect(() => {
        if (selectedProject) {
            loadProcessDefinitions(selectedProject.projectId);
        } else {
            setProcessDefinitions([]);
        }
    }, [selectedProject]);

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

    const loadProcessDefinitions = async (projectId: string) => {
        try {
            setLoadingProcesses(true);
            const processes =
                await bpmnService.getProcessDefinitionsByProject(projectId);
            setProcessDefinitions(processes);
        } catch (error) {
            toast.error('Failed to load process definitions');
            console.error('Error loading process definitions:', error);
        } finally {
            setLoadingProcesses(false);
        }
    };

    const handleProjectChange = (projectId: string) => {
        const project = projects.find((p) => p.projectId === projectId);
        setSelectedProject(project || null);
    };

    const handleGenerateProcess = async (
        process: BPMNProjectProcessDefinition
    ) => {
        try {
            // Show loading state
            toast.loading(
                `Loading process definition for ${process.processKey}...`
            );

            // Get the BPMN XML content from the process details
          
            // Create a comprehensive page definition for the studio
            const processConfig: ProcessConfig = {
                type: 'process',
                processKey: process.processKey,
                name: process.processKey,
                processVersion: `v${process.version}` || 'v1',
                description: process.title,
                steps: process.projectArtifacts?.map((artifact) => ({
                    id: artifact.taskKey,
                    name: artifact.name
                })),
                id: getId(),
            };
            console.log('processConfig', processConfig);
            const { error } = await window.engine.createProcess(
                processConfig,
                ENV_TYPES.NEXTJS,
                basePath
            );
            console.log('error', error);
        } catch (error) {
            toast.dismiss();
            console.error('Error loading process definition:', error);
            toast.error('Failed to load process definition', {
                description:
                    error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };

    const handleGenerateStepProcess = async (
        process: BPMNProjectProcessDefinition
    ) => {
        try {
            // Show loading state
            toast.loading(
                `Loading process definition for ${process.processKey}...`
            );

            // Fetch the complete process definition details
            const processDetails =
                await bpmnService.getProcessDefinitionDetails(
                    process.processDefinitionId
                );
            console.log('Process definition details:', processDetails);

            // Get the BPMN XML content from the process details
            const processXml =
                processDetails.bpmFileContent ||
                (await bpmnService.getProcessDefinitionXML(
                    process.processDefinitionId
                ));

            // Create a comprehensive page definition for the studio
            const pageDefinition: any = {
                id: `bpmn-${process.processDefinitionId}`,
                processDefinitionId: process.processDefinitionId,
                processDefinitionKey: process.processKey,
                description: `Process from ${selectedProject?.name || 'BPMN'} project`,
                isStartPage: true,
                isTaskPage: false,
                content: {
                    type: 'process',
                    processKey: process.processKey,
                    name: process.processKey,
                    pageName: `${process.processKey}`,
                    pagePath: ``,
                    processVersion: `v${process.version}` || 'v1',
                    description: process.title,
                    // Add artifacts information as JSON string
                    artifacts: processDetails.projectArtifacts,
                },
            };

            // Dismiss loading toast and show success
            toast.dismiss();
            onPageClick?.(pageDefinition);
            toast.success(`Opening ${process.processKey} in page builder`, {
                description: `Loaded process definition with ${processXml ? 'XML content' : 'basic info'}`,
            });
        } catch (error) {
            toast.dismiss();
            console.error('Error loading process definition:', error);
            toast.error('Failed to load process definition', {
                description:
                    error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };

    const handleDownloadArtifact = async (artifact: BPMNProjectArtifact) => {
        try {
            toast.loading(`Downloading artifact: ${artifact.name}...`);

            // Fetch the artifact content
            const artifactDetails = await bpmnService.getArtifactContent(
                artifact.projectArtifactId
            );

            const blob = new Blob([artifactDetails.content], {
                type: 'application/octet-stream',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = artifact.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.dismiss();
            toast.success(`Downloaded artifact: ${artifact.name}`);
        } catch (error) {
            toast.dismiss();
            console.error('Error downloading artifact:', error);
            toast.error('Failed to download artifact', {
                description:
                    error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    console.log('processDefinitions', processDefinitions);

    return (
        <div className="space-y-6">
            {/* Project Selection */}
            <div className="space-y-2">
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

            {/* Selected Project Info */}
            {selectedProject && (
                <Card className="relative overflow-hidden  bg-gradient-to-br from-background to-muted/30">
                    <CardHeader className="relative">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <CardTitle className="flex items-center space-x-3 text-xl">
                                    <div className="flex items-center space-x-2">
                                        <span className="font-bold">
                                            {selectedProject.name}
                                        </span>
                                        <Badge
                                            variant={
                                                selectedProject.active
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                            className="text-xs px-2 py-1"
                                        >
                                            {selectedProject.code}
                                        </Badge>
                                    </div>
                                </CardTitle>
                                <CardDescription className="mt-2 text-base leading-relaxed">
                                    {selectedProject.description ||
                                        'No description available'}
                                </CardDescription>
                            </div>

                            {/* Status indicator */}
                            <div className="flex flex-col items-end space-y-2">
                                <Badge
                                    variant={
                                        selectedProject.active
                                            ? 'default'
                                            : 'destructive'
                                    }
                                    className={`px-3 py-1 text-xs font-medium ${
                                        selectedProject.active
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                    }`}
                                >
                                    <div className="flex items-center space-x-1">
                                        <div
                                            className={`w-2 h-2 rounded-full ${
                                                selectedProject.active
                                                    ? 'bg-green-500'
                                                    : 'bg-red-500'
                                            }`}
                                        ></div>
                                        <span>
                                            {selectedProject.active
                                                ? 'Active'
                                                : 'Inactive'}
                                        </span>
                                    </div>
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="relative">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Process Definitions Count */}
                            <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <svg
                                        className="w-5 h-5 text-blue-600 dark:text-blue-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-foreground">
                                        {processDefinitions?.length || 0}
                                    </div>
                                    <div className="text-xs text-muted-foreground font-medium">
                                        Process Definitions
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Process Definitions */}
            {selectedProject && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">
                            Process Definitions
                        </h3>
                        {loadingProcesses && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        )}
                    </div>

                    {loadingProcesses ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                    ) : processDefinitions.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {processDefinitions.map((process) => (
                                <Card
                                    key={process.processDefinitionId}
                                    className="hover:shadow-md transition-shadow"
                                >
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">
                                            <div>
                                                <span className="font-medium">
                                                    {process.title}
                                                </span>
                                                <Badge
                                                    variant={'outline'}
                                                    className="ml-2"
                                                >
                                                    {process.processKey}
                                                </Badge>
                                            </div>
                                        </CardTitle>
                                        <CardDescription className="text-sm">
                                            Version{' '}
                                            {process.version
                                                ? process.version
                                                : 'N/A'}{' '}
                                            • {process.statusDesc}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="text-sm text-muted-foreground">
                                            <div>
                                                Deployment:{' '}
                                                {process.deploymentId}
                                            </div>
                                            <div>
                                                Deployed:{' '}
                                                {new Date(
                                                    process.deploymentDate || ''
                                                ).toLocaleDateString()}
                                            </div>
                                        </div>

                                        {process.projectArtifacts &&
                                            process.projectArtifacts.length >
                                                0 && (
                                                <div className="text-sm">
                                                    <span className="font-medium">
                                                        Artifacts:
                                                    </span>{' '}
                                                    {
                                                        process.projectArtifacts
                                                            .length
                                                    }
                                                </div>
                                            )}

                                        <Separator />

                                        <div className="flex space-x-2">
                                            {bpmnProcesses.find(
                                                (p) =>
                                                    p.name ===
                                                        process.processKey &&
                                                    p.children.some(
                                                        (c: any) =>
                                                            c.name ===
                                                            `v${process.version}`
                                                    )
                                            ) ? (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild
                                                    >
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="flex-1"
                                                        >
                                                            View Artifacts
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuLabel>
                                                            Available Artifacts
                                                        </DropdownMenuLabel>
                                                        {process.projectArtifacts?.map(
                                                            (
                                                                artifact,
                                                                index
                                                            ) => (
                                                                <DropdownMenuItem
                                                                    key={index}
                                                                    onClick={() =>
                                                                        handleDownloadArtifact(
                                                                            artifact
                                                                        )
                                                                    }
                                                                >
                                                                    {
                                                                        artifact.name
                                                                    }
                                                                </DropdownMenuItem>
                                                            )
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        handleGenerateProcess(
                                                            process
                                                        )
                                                    }
                                                    className="flex-1"
                                                >
                                                    Generate Process
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
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

            {/* No Projects Message */}
            {!loading && projects.length === 0 && (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        No projects found. Please check your BPMN API
                        configuration.
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
