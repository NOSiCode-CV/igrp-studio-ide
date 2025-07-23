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
} from 'src/main/types';
import { bpmnService } from '@renderer/services/bpmn-service';
import { bpmnMockService } from '@renderer/services/bpmn-mock-service';

interface BPMNProjectSelectorProps {
    onPageClick?: (pageDefinition: BPMNPageDefinition) => void;
    useMockService?: boolean;
}

export const BPMNProjectSelector = ({
    onPageClick,
    useMockService = true,
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

    // Get the appropriate service based on configuration
    const getService = () => {
        return useMockService ? bpmnMockService : bpmnService;
    };

    // Load projects on component mount
    useEffect(() => {
        loadProjects();
    }, [useMockService]);

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
            const projectsData = await getService().getProjects();
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
                await getService().getProcessDefinitionsByProject(projectId);
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

    const handleEditProcess = async (process: BPMNProjectProcessDefinition) => {
        try {
            // Create a temporary page definition for the studio
            const pageDefinition: BPMNPageDefinition = {
                id: `bpmn-${process.processDefinitionId}}`,
                processDefinitionId: process.processDefinitionId,
                processDefinitionKey: process.processKey,
                description: `Process from ${selectedProject?.name} project`,
                isStartPage: true,
                isTaskPage: false,
                content: {
                    type: 'bpmn-process',
                    processKey: process.processKey,
                    processName: process.processKey,
                    processId: process.processDefinitionId,
                    processVersion: process.version.toString(),
                    processCategory: selectedProject?.name || 'General',
                    projectId: selectedProject?.projectId || '',
                    projectCode: selectedProject?.code || '',
                    projectName: selectedProject?.name || '',
                    pageName: `${process.processKey} - ${selectedProject?.name || 'BPMN Process'}`,
                    pagePath: `/bpmn/${selectedProject?.code || 'project'}/${process.processKey}`,
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            onPageClick?.(pageDefinition);
            toast.success(`Opening ${process.processKey} in page builder`);
        } catch (error) {
            toast.error('Failed to open process in page builder', {
                description:
                    error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };

    const handleViewProcess = (process: BPMNProjectProcessDefinition) => {
        toast.info(`Viewing details for ${process.processKey}`, {
            description: `Version ${process.version}, State: ${process.state}`,
        });
    };

    const handleViewArtifacts = (process: BPMNProjectProcessDefinition) => {
        const artifactCount = process.projectArtifacts.length;
        toast.info(`Process has ${artifactCount} artifacts`, {
            description: process.projectArtifacts.map((a) => a.name).join(', '),
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

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
                        {projects.map((project) => (
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
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <span>{selectedProject.name}</span>
                            <Badge
                                variant={
                                    selectedProject.active
                                        ? 'default'
                                        : 'secondary'
                                }
                            >
                                {selectedProject.code}
                            </Badge>
                        </CardTitle>
                        <CardDescription>
                            {selectedProject.description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium">Version:</span>{' '}
                                {selectedProject.currentVersion}
                            </div>
                            <div>
                                <span className="font-medium">Status:</span>
                                <Badge
                                    variant={
                                        selectedProject.active
                                            ? 'default'
                                            : 'secondary'
                                    }
                                    className="ml-2"
                                >
                                    {selectedProject.active
                                        ? 'Active'
                                        : 'Inactive'}
                                </Badge>
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
                                            {process.processKey}
                                        </CardTitle>
                                        <CardDescription className="text-sm">
                                            Version {process.version} •{' '}
                                            {process.state}
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
                                                    process.deploymentDate
                                                ).toLocaleDateString()}
                                            </div>
                                        </div>

                                        {process.projectArtifacts.length >
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
                                            <Button
                                                size="sm"
                                                onClick={() =>
                                                    handleEditProcess(process)
                                                }
                                                className="flex-1"
                                            >
                                                Edit Page
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    handleViewProcess(process)
                                                }
                                            >
                                                View
                                            </Button>
                                            {process.projectArtifacts.length >
                                                0 && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        handleViewArtifacts(
                                                            process
                                                        )
                                                    }
                                                >
                                                    Artifacts
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
