import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@renderer/components/ui/card';
import { useWorkspace } from '@renderer/hooks/use-workspace';
import { ProjectData } from 'src/main/types';
import { Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getLocale } from '@renderer/utils/helpers';
import { ProjectIcon } from '@renderer/components/shared-ui';
import { ProjectActions } from './project-actions';

interface ProjectProps {
    projects: ProjectData[];
    onEdit?: () => void;
    onDelete: (prompt: boolean) => void;
    workspaceId: string;
    projectOrder: string;
}
const ProjectGrid = ({ projects, projectOrder, onDelete }: ProjectProps) => {
    const {
        workspace,
        actions: { saveOrOpenProject },
    } = useWorkspace();

    const handleOpenProject = async (p: ProjectData): Promise<void> => {
        saveOrOpenProject(p);
    };

    const sortProjects = (projects: any[]) => {
        return [...projects].sort((a, b) => {
            if (projectOrder === 'name') {
                return a.name.localeCompare(b.name);
            } else if (projectOrder === 'lastModified') {
                return (
                    new Date(b.config?.lastModified).getTime() -
                    new Date(a.config?.lastModified).getTime()
                );
            }
            return 0;
        });
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {sortProjects(
                projects.map((project, index) => {
                    return (
                        <Card
                            key={index}
                            className="cursor-pointer group gap-1 border rounded-lg shadow-sm"
                            onClick={(e) => {
                                e.preventDefault();
                                handleOpenProject(project);
                            }}
                        >
                            <CardHeader>
                                <CardTitle>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <ProjectIcon project={project} />
                                            <span className="text-xs truncate text-ellipsis">
                                                {project.name}
                                            </span>
                                        </div>
                                        <ProjectActions
                                            project={project}
                                            basePath={workspace.path}
                                            onDelete={(success) =>
                                                onDelete(success)
                                            }
                                            /* onEdit={
                                                onEdit
                                                    ? () => onEdit(project)
                                                    : undefined
                                            } */
                                        />
                                    </div>
                                </CardTitle>
                                <CardDescription>
                                    {project.config?.description && (
                                        <p className="text-sm text-muted-foreground mb-2">
                                            {project.config.description}
                                        </p>
                                    )}
                                </CardDescription>
                            </CardHeader>
                            <CardContent></CardContent>
                            <CardFooter className="flex items-center text-muted-foreground justify-between">
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
                                {/*  <div className="flex">
                                    <ProjectConfigurationDialog
                                        project={project}
                                        projects={projects}
                                        onSave={() => void 0}
                                        isNew={false}
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                </div> */}
                            </CardFooter>
                        </Card>
                    );
                })
            )}
        </div>
    );
};

export default ProjectGrid;
