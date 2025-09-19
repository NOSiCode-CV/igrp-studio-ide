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
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system';
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
import useToast from '@renderer/hooks/useToast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
} from '@renderer/components/ui/dropdown-menu';
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { Toggle } from '@renderer/components/ui/toggle';
import { ServiceGrid } from './services/service-grid';
import { SearchInput, SubHeadline } from '@renderer/components/shared-ui';
import { ConfigurationDialog } from './components/configuration-dialog';
import { useDocker } from '@renderer/hooks/use-docker';
import { ServiceList } from './services/service-list';
import { ProjectList } from './projects/project-list';
import ProjectGrid from './projects/project-grid';
import { getId } from '@renderer/utils';

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
                        placeholder={`${t('search')} ${type}s...`}
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
                    <span>{t('sortBy')}</span>
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
    const [projectViewMode, setProjectViewMode] = useState<ViewMode>('grid');
    const [serviceViewMode, setServiceViewMode] = useState<ViewMode>('grid');
    const [projectSearchQuery, setProjectSearchQuery] = useState('');
    const [serviceSearchQuery, setServiceSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<string>('lastModified');
    const [sortOrderService, setSortOrderService] =
        useState<string>('lastModified');
    const [allProjects, setAllProjects] = useState<ProjectData[]>([]);

    const { showErrorToast } = useToast();

    const { t } = useTranslation();

    const {
        workspace,
        actions: { findAllProjects, saveOrOpenProject, refreshWorkspaces },
        state: { changeStatus },
    } = useWorkspace();

    const { services, refreshContainers } = useDocker({
        workspace,
        changeStatus,
    });

    useEffect(() => {
        fetchProjects();
        refreshWorkspaces();
        refreshContainers();
    }, [changeStatus, workspace]);

    const fetchProjects = async () => {
        await findAllProjects().then((data) => {
            setAllProjects(data);
        });
    };

    const filteredProjects = allProjects.filter(
        (project) =>
            (project.name &&
                project.name
                    .toLowerCase()
                    .includes(projectSearchQuery.toLowerCase())) ||
            (project.framework &&
                project.framework
                    .toLowerCase()
                    .includes(projectSearchQuery.toLowerCase()))
    );

    const filteredServices = services.filter(
        (service) =>
            !service.labels?.is_project &&
            service.container_name &&
            service.container_name
                .toLowerCase()
                .includes(serviceSearchQuery.toLowerCase())
    );

    const onHandleOpenProjectClick = async (): Promise<void> => {
        const result: IOpenProject = await window.api.openDirectory();

        const { canceled, basePath, config, folderExists } = result;

        if (canceled || !basePath || !config) {
            return;
        }

        if (!folderExists || !config.framework) {
            showErrorToast(t('notFoundProject'));
            return;
        }

        saveOrOpenProject({
            project: {
                ...config,
                id: config.id ?? getId(),
                workspaceId: workspace.id,
            },
        });
    };

    const ProjectActions = () => {
        const [openCloneProject, setOpenCloneProject] = useState(false);
        return (
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
                        <DropdownMenuItem
                            onClick={() => setOpenCloneProject(true)}
                        >
                            <GitFork className="w-4 h-4 mr-2" />
                            {t('cloneProject')}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <ProjectWizard />
                {openCloneProject && (
                    <CloneProjectModal
                        open={openCloneProject}
                        setOpen={setOpenCloneProject}
                        workspace={workspace}
                    />
                )}
            </>
        );
    };

    const ServiceActions = () => {
        const [open, setOpen] = useState(false);

        return (
            <>
                <IGRPButtonPrimitive onClick={() => setOpen(true)}>
                    <PlusCircle className="w-4 h-4" />
                    {t('newService')}
                </IGRPButtonPrimitive>

                {open && (
                    <ConfigurationDialog
                        services={filteredServices}
                        isNew={true}
                        open={open}
                        setOpen={setOpen}
                    />
                )}
            </>
        );
    };

    const ProjectEmptyState = () => (
        <div className="shrink-0 border border-dashed rounded-md p-6 text-center">
            <FolderKanban className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <h3 className="text-sm font-medium">{t('noProjectsFound')}</h3>
            <p className="text-xs text-muted-foreground mb-3">
                {projectSearchQuery
                    ? `${t('noProjectsMatching')} "${projectSearchQuery}"`
                    : t('noProjectsYet')}
            </p>
            <ProjectWizard>
                <IGRPButtonPrimitive size="sm">
                    <PlusCircle className="h-3.5 w-3.5 mr-1" />
                    {t('createNewProject')}
                </IGRPButtonPrimitive>
            </ProjectWizard>
        </div>
    );

    const ServiceEmptyState = () => (
        <div className="border border-dashed rounded-md p-6 text-center">
            <Server className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <h3 className="text-sm font-medium">{t('noServicesFound')}
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
                {serviceSearchQuery
                    ? `${t('noServicesMatching')} "${serviceSearchQuery}"`
                    : t('noServicesYet')}
            </p>
            <ConfigurationDialog services={filteredServices} isNew={true}>
                <IGRPButtonPrimitive size="sm">
                    <PlusCircle className="h-3.5 w-3.5 mr-1" />
                    {t('addNewService')}
                </IGRPButtonPrimitive>
            </ConfigurationDialog>
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
                    <>
                        <ProjectGrid
                            projects={filteredProjects}
                            workspaceId={workspace.id}
                            projectOrder={sortOrder}
                            services={services}
                        />
                    </>
                ) : (
                    <ProjectList
                        projects={filteredProjects}
                        workspaceId={workspace.id}
                        services={services}
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
                sortValue={sortOrderService}
                onSortChange={setSortOrderService}
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
