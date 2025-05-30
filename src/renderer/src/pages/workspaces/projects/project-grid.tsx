import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@renderer/components/ui/card';
import { useWorkspace } from '@renderer/hooks/use-workspace';
import { ProjectData, ServiceInfo } from 'src/main/types';
import { Clock, Folder } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getLocale } from '@renderer/utils';
import { ProjectIcon } from '@renderer/components/shared-ui';
import { ProjectActions } from './project-actions';
import { Button } from '@renderer/components/ui/button';
import { PortsBadgeList } from '../components/ports-badge-list';
import Dependency from '../components/dependency';
import { useTranslation } from 'react-i18next';

interface ProjectProps {
    projects: ProjectData[];
    onEdit?: () => void;
    workspaceId: string;
    projectOrder: string;
    services: ServiceInfo[];
}
const ProjectGrid = ({ projects, projectOrder, services }: ProjectProps) => {
    const {
        workspace,
        actions: { saveOrOpenProject },
    } = useWorkspace();
    const { t } = useTranslation();

    const handleOpenProject = async (project: ProjectData): Promise<void> => {
        saveOrOpenProject({  project, openProject: true });
    };

    const sortProjects = (projects: any[]) => {
        return [...projects].sort((a, b) => {
            if (projectOrder === 'name') {
                return a.name?.localeCompare(b.name);
            } else if (projectOrder === 'lastModified') {
                return (
                    new Date(b.config?.lastModified).getTime() -
                    new Date(a.config?.lastModified).getTime()
                );
            }
            return 0;
        });
    };

    const findServiceByProjectName = (
        uuid: string
    ): ServiceInfo | undefined => {
        return services.find((service) => service.labels?.uuid === uuid);
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {sortProjects(
                projects.map((project, index) => {
                    const service = findServiceByProjectName(project.id);
                    const dependsOn = service?.dependsOn || [];
                    const ports = service?.ports || [];
                    return (
                        <Card
                            key={index}
                            className="cursor-pointer group gap-2 border rounded-lg shadow-sm"
                        >
                            <CardHeader>
                                <CardTitle>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <ProjectIcon project={project} />
                                            <span className="text-xs truncate text-ellipsis md:max-w-40">
                                                {project.name}
                                            </span>
                                        </div>
                                        <ProjectActions
                                            project={project}
                                            projects={projects}
                                            basePath={workspace.path}
                                            services={services}
                                        />
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {project.config?.description && (
                                    <p className="text-sm text-muted-foreground">
                                        {project.config.description}
                                    </p>
                                )}
                                {ports.length > 0 && (
                                    <PortsBadgeList ports={ports} />
                                )}
                                {ports.length > 0 && (
                                    <Dependency dependsOn={dependsOn} />
                                )}
                            </CardContent>
                            <CardFooter className="flex flex-wrap text-muted-foreground justify-between gap-2">
                                <div className="text-xs flex items-center">
                                    {project.updatedAt && (
                                        <>
                                            <Clock className="w-3 h-3 mr-1" />
                                            {formatDistanceToNow(
                                                project.updatedAt,
                                                {
                                                    addSuffix: true,
                                                    locale: getLocale(),
                                                }
                                            )}
                                        </>
                                    )}
                                </div>
                                <Button
                                    variant={'outline'}
                                    size={'sm'}
                                    className="w-full"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleOpenProject(project);
                                    }}
                                >
                                    <Folder />
                                    {t('open')}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })
            )}
        </div>
    );
};

export default ProjectGrid;
