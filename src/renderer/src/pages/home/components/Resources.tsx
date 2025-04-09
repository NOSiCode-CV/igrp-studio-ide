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
    LucideIcon,
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
import { ServiceGrid } from './services/service-grid';
import { SearchInput, SubHeadline } from '@renderer/components/shared-ui';
import { ServiceConfigurationDialog } from './services/service-configuration-dialog';
import { useDocker } from '@renderer/hooks/use-docker';
import { ServiceList } from './services/service-list';
import { ProjectList } from './projects/project-list';
import ProjectGrid from './projects/project-grid';

type ResourceType = 'project' | 'service';
type ViewMode = 'grid' | 'list';

interface ResourceSectionProps {
    type: ResourceType;
    icon: LucideIcon;
    title: string;
    count: number;
    searchQuery: string;
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
    onSearchChange: (value: string) => void;
    sortValue: string;
    onSortChange: (value: string) => void;
    isEmpty: boolean;
    emptyState: React.ReactNode;
    children: React.ReactNode;
    actionButtons: React.ReactNode;
}

const ResourceSection = ({
    type,
    icon,
    title,
    count,
    searchQuery,
    viewMode,
    onViewModeChange,
    onSearchChange,
    sortValue,
    onSortChange,
    isEmpty,
    emptyState,
    children,
    actionButtons,
}: ResourceSectionProps) => {
    const { t } = useTranslation();
    const countText = `${count} ${count === 1 ? type : `${type}s`}`;
    const queryText = searchQuery ? ` matching "${searchQuery}"` : '';

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <SubHeadline
                    icon={icon}
                    title={title}
                    description={
                        <>
                            {countText}
                            {queryText}
                        </>
                    }
                />
                <div className="flex items-center gap-3">{actionButtons}</div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                    <SearchInput
                        placeholder={`Search ${type}s...`}
                        value={searchQuery}
                        onChange={onSearchChange}
                        className="lg:w-[250px]"
                    />
                    <ToggleGroup
                        type="single"
                        value={viewMode}
                        onValueChange={(value) =>
                            value && onViewModeChange(value as ViewMode)
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
                    <Select value={sortValue} onValueChange={onSortChange}>
                        <SelectTrigger className="w-[180px] !h-7">
                            <SelectValue placeholder={t('orderBy')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="lastModified">
                                {t('lastModified')}
                            </SelectItem>
                            <SelectItem value="name">{t('name')}</SelectItem>
                            <SelectItem value="type">{t('type')}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            {isEmpty ? emptyState : children}
        </div>
    );
};

const Resources = () => {
    const [isDelete, setIsDelete] = useState(false);
    const [projectViewMode, setProjectViewMode] = useState<ViewMode>('grid');
    const [serviceViewMode, setServiceViewMode] = useState<ViewMode>('grid');
    const [projectSearchQuery, setProjectSearchQuery] = useState('');
    const [serviceSearchQuery, setServiceSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<string>('lastModified');

    const { showErrorToast } = useToast();
    const { t } = useTranslation();

    const {
        workspace,
        actions: { findAllProjects, saveOrOpenProject },
        state: { changeStatus },
    } = useWorkspace();

    const { services, refreshContainers } = useDocker();
    const [allProjects, setProjects] = useState<ProjectData[]>([]);

    useEffect(() => {
        fetchProjects();
    }, [workspace]);

    useEffect(() => {
        if (isDelete) fetchProjects();
    }, [isDelete]);

    useEffect(() => {
        if (changeStatus) {
            refreshContainers();
        }
    }, [changeStatus, refreshContainers]);

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

    const ProjectActions = () => (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Toggle size={'sm'} variant={'outline'}>
                        <EllipsisVertical />
                    </Toggle>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={onHandleOpenProjectClick}>
                        <FolderOpen className="w-4 h-4 mr-2" />
                        <span>{t('openProject')}</span>
                    </DropdownMenuItem>
                    <CloneProjectModal handleCloneProject={handleCloneProject}>
                        <DropdownMenuItem>
                            <GitFork className="w-4 h-4 mr-2" />
                            {t('cloneProject')}
                        </DropdownMenuItem>
                    </CloneProjectModal>
                </DropdownMenuContent>
            </DropdownMenu>
            <ProjectWizard />
        </>
    );

    const ServiceActions = () => (
        <ServiceConfigurationDialog services={filteredServices} isNew={true} />
    );

    const ProjectEmptyState = () => (
        <div className="shrink-0 border border-dashed rounded-md p-6 text-center">
            <FolderKanban className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <h3 className="text-sm font-medium">No projects found</h3>
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
    );

    const ServiceEmptyState = () => (
        <div className="border border-dashed rounded-md p-6 text-center">
            <Server className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <h3 className="text-sm font-medium">No services found</h3>
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
    );

    return (
        <div className="space-y-6">
            {/* Projects Section */}
            <ResourceSection
                type="project"
                icon={FolderKanban}
                title={t('projects')}
                count={filteredProjects.length}
                searchQuery={projectSearchQuery}
                viewMode={projectViewMode}
                onViewModeChange={setProjectViewMode}
                onSearchChange={setProjectSearchQuery}
                sortValue={sortOrder}
                onSortChange={setSortOrder}
                isEmpty={filteredProjects.length === 0}
                emptyState={<ProjectEmptyState />}
                actionButtons={<ProjectActions />}
            >
                {projectViewMode === 'grid' ? (
                    <ProjectGrid
                        projects={filteredProjects}
                        workspaceId={workspace.id}
                        projectOrder={sortOrder}
                        onDelete={setIsDelete}
                    />
                ) : (
                    <ProjectList
                        projects={filteredProjects}
                        workspaceId={workspace.id}
                    />
                )}
            </ResourceSection>

            {/* Services Section */}
            <ResourceSection
                type="service"
                icon={Server}
                title={t('services')}
                count={filteredServices.length}
                searchQuery={serviceSearchQuery}
                viewMode={serviceViewMode}
                onViewModeChange={setServiceViewMode}
                onSearchChange={setServiceSearchQuery}
                sortValue={sortOrder}
                onSortChange={setSortOrder}
                isEmpty={filteredServices.length === 0}
                emptyState={<ServiceEmptyState />}
                actionButtons={<ServiceActions />}
            >
                {serviceViewMode === 'grid' ? (
                    <ServiceGrid
                        services={filteredServices}
                        workspaceId={workspace.id}
                    />
                ) : (
                    <ServiceList
                        services={filteredServices}
                        workspaceId={workspace.id}
                    />
                )}
            </ResourceSection>
        </div>
    );
};

export default Resources;
