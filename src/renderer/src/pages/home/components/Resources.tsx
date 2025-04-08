import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IOpenProject, ProjectData } from 'src/main/types';
import {
    EllipsisVertical,
    FolderKanban,
    FolderOpen,
    GitFork,
    LayoutGrid,
    List,
    PlusCircle,
    Server,
} from 'lucide-react';
import { Button } from '@renderer/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@renderer/components/ui/select';
import { useWorkspace } from '@renderer/hooks/use-workspace';
import {
    ToggleGroup,
    ToggleGroupItem,
} from '@renderer/components/ui/toggle-group';
import ProjectGrid from './project-grid';
import { ProjectWizard } from '@renderer/pages/project';
import { CloneProjectModal } from '@renderer/components/git/clone-project-modal';
import useToast from '@renderer/components/useToast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
} from '@renderer/components/ui/dropdown-menu';
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { Toggle } from '@renderer/components/ui/toggle';
import { ServiceGrid } from './service-grid';
import { SearchInput, SubHeadline } from '@renderer/components/shared-ui';
import { ServiceConfigurationDialog } from './service-configuration-dialog';
import { useDocker } from '@renderer/hooks/use-docker';

const Resources = () => {
    const [isDelete, setIdDelete] = useState(false);
    const [projectViewMode, setProjectViewMode] = useState<'grid' | 'list'>(
        'grid'
    );
    const [serviceViewMode, setServiceViewMode] = useState<'grid' | 'list'>(
        'grid'
    );

    const [serviceSearchQuery, setServiceSearchQuery] = useState('');

    const { showErrorToast } = useToast();

    const {
        workspace,
        actions: { findAllProjects, saveOrOpenProject },
        state: { changeStatus },
    } = useWorkspace();

    const { services, refreshContainers } = useDocker();

    const { t } = useTranslation();

    const [projectSearchQuery, setProjectSearchQuery] = useState('');

    const [allProjects, setProjects] = useState<ProjectData[]>([]);

    const [projectOrder] = useState<string>('lastModified');

    const [localProjectOrder, setLocalProjectOrder] =
        useState<string>('lastModified');

    useEffect(() => {
        fetchProjects();
    }, [workspace]);

    useEffect(() => {
        if (isDelete) fetchProjects();
    }, [isDelete]);

    const fetchProjects = async () => {
        await findAllProjects().then((data) => {
            setProjects(data);
        });
    };

    const filteredProjects = allProjects.filter(
        (project) =>
            project.name
                .toLowerCase()
                .includes(projectSearchQuery.toLowerCase()) ||
            project.framework
                .toLowerCase()
                .includes(projectSearchQuery.toLowerCase())
    );

    const filteredServices = services.filter(
        (service) =>
            service.containerName &&
            service.containerName
                .toLowerCase()
                .includes(serviceSearchQuery.toLowerCase())
    );

    useEffect(() => {
        if (changeStatus) {
            refreshContainers();
        }
    }, [changeStatus, refreshContainers]);
    const onHandleOpenProjectClick = async (): Promise<void> => {
        const result: IOpenProject = await window.api.openDirectory('');

        const { canceled, basePath, config, folderExists } = result;

        if (canceled || !basePath || !config) {
            return;
        }

        if (!folderExists || !config.framework) {
            showErrorToast(t('notFoundProject'));
            return;
        }

        saveOrOpenProject(config);
    };

    const handleCloneProject = async (url: string): Promise<void> => {
        try {
            await window.electron.ipcRenderer.invoke('clone-repository', url);
        } catch (error) {
            console.error('Error cloning repository:', error);
            showErrorToast(t('cloneProjectError'));
        }
    };

    const projectCountText = `${filteredProjects.length} ${
        filteredProjects.length === 1 ? 'project' : 'projects'
    }`;

    const searchQueryText = projectSearchQuery
        ? ` matching "${projectSearchQuery}"`
        : '';

    const serviceCountText = `${filteredServices.length} ${
        filteredServices.length === 1 ? 'service' : 'services'
    }`;

    const serviceQueryText = serviceSearchQuery
        ? ` matching "${serviceSearchQuery}"`
        : '';

    return (
        <div className="space-y-6">
            {/* Projects Section */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <SubHeadline
                        icon={FolderKanban}
                        title={t('projects')}
                        description={
                            <>
                                {projectCountText}
                                {searchQueryText}
                            </>
                        }
                    />

                    <div className="flex items-center gap-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Toggle size={'sm'} variant={'outline'}>
                                    <EllipsisVertical></EllipsisVertical>
                                </Toggle>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem
                                    onClick={onHandleOpenProjectClick}
                                >
                                    <FolderOpen className="w-4 h-4 mr-2" />
                                    <span> {t('openProject')}</span>
                                </DropdownMenuItem>
                                <CloneProjectModal
                                    handleCloneProject={handleCloneProject}
                                >
                                    <DropdownMenuItem>
                                        <GitFork className="w-4 h-4 mr-2" />
                                        {t('cloneProject')}
                                    </DropdownMenuItem>
                                </CloneProjectModal>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <ProjectWizard />
                    </div>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                        <SearchInput
                            placeholder="Search projects..."
                            value={projectSearchQuery}
                            onChange={(value) => setProjectSearchQuery(value)}
                        />
                        <ToggleGroup
                            type="single"
                            value={projectViewMode}
                            onValueChange={(value) =>
                                value &&
                                setProjectViewMode(value as 'grid' | 'list')
                            }
                        >
                            <ToggleGroupItem
                                value="grid"
                                size="sm"
                                className="h-8 w-8"
                            >
                                <LayoutGrid className="h-3.5 w-3.5" />
                            </ToggleGroupItem>
                            <ToggleGroupItem
                                value="list"
                                size="sm"
                                className="h-8 w-8"
                            >
                                <List className="h-3.5 w-3.5" />
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Sort by:</span>
                        <Select
                            value={localProjectOrder}
                            onValueChange={setLocalProjectOrder}
                        >
                            <SelectTrigger className="w-[180px] !h-7">
                                <SelectValue placeholder={t('orderBy')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="lastModified">
                                    {t('lastModified')}
                                </SelectItem>
                                <SelectItem value="name">
                                    {t('name')}
                                </SelectItem>
                                <SelectItem value="type">
                                    {t('type')}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                {filteredProjects.length === 0 ? (
                    <div className="shrink-0 border border-dashed rounded-md p-6 text-center">
                        <FolderKanban className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <h3 className="text-sm font-medium">
                            No projects found
                        </h3>
                        <p className="text-xs text-muted-foreground mb-3">
                            {projectSearchQuery
                                ? `No projects matching "${projectSearchQuery}"`
                                : "This workspace doesn't have any projects yet."}
                        </p>
                        <ProjectWizard>
                            <Button size="sm">
                                <PlusCircle className="h-3.5 w-3.5 mr-1" />
                                Create New Project
                            </Button>
                        </ProjectWizard>
                    </div>
                ) : projectViewMode === 'grid' ? (
                    <ProjectGrid
                        projects={filteredProjects}
                        workspaceId={workspace.id}
                        projectOrder={projectOrder}
                        onDelete={setIdDelete}
                    />
                ) : (
                    <></>
                )}
            </div>
            {/* Services Section */}
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <SubHeadline
                        icon={Server}
                        title={t('services')}
                        description={
                            <>
                                {serviceCountText}
                                {serviceQueryText}
                            </>
                        }
                    />
                    <ServiceConfigurationDialog
                        services={filteredServices}
                        isNew={true}
                    ></ServiceConfigurationDialog>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                        <SearchInput
                            placeholder="Search services..."
                            value={serviceSearchQuery}
                            onChange={(value) => setServiceSearchQuery(value)}
                        />

                        <ToggleGroup
                            type="single"
                            value={serviceViewMode}
                            onValueChange={(value) =>
                                value &&
                                setServiceViewMode(value as 'grid' | 'list')
                            }
                        >
                            <ToggleGroupItem
                                value="grid"
                                size="sm"
                                className="h-8 w-8"
                            >
                                <LayoutGrid className="h-3.5 w-3.5" />
                            </ToggleGroupItem>
                            <ToggleGroupItem
                                value="list"
                                size="sm"
                                className="h-8 w-8"
                            >
                                <List className="h-3.5 w-3.5" />
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Sort by:</span>
                        <Select
                            value={localProjectOrder}
                            onValueChange={setLocalProjectOrder}
                        >
                            <SelectTrigger className="w-[180px] !h-7">
                                <SelectValue placeholder={t('orderBy')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="lastModified">
                                    {t('lastModified')}
                                </SelectItem>
                                <SelectItem value="name">
                                    {t('name')}
                                </SelectItem>
                                <SelectItem value="type">
                                    {t('type')}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {filteredServices.length === 0 ? (
                    <div className="border border-dashed rounded-md p-6 text-center">
                        <Server className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <h3 className="text-sm font-medium">
                            No services found
                        </h3>
                        <p className="text-xs text-muted-foreground mb-3">
                            {serviceSearchQuery
                                ? `No services matching "${serviceSearchQuery}"`
                                : "This workspace doesn't have any services yet."}
                        </p>

                        <ServiceConfigurationDialog
                            services={filteredServices}
                            isNew={true}
                        >
                            <Button size="sm">
                                <PlusCircle className="h-3.5 w-3.5 mr-1" />
                                Add New Service
                            </Button>
                        </ServiceConfigurationDialog>
                    </div>
                ) : serviceViewMode === 'grid' ? (
                    <ServiceGrid
                        services={filteredServices}
                        workspaceId={workspace.id}
                    />
                ) : (
                    <></>
                )}
            </div>
        </div>
    );
};

export default Resources;
