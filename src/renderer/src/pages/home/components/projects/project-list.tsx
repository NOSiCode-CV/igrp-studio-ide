'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@renderer/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { ProjectData } from 'src/main/types';
import { ProjectIcon } from '@renderer/components/shared-ui';
import Dependency from '../dependency';
import { ProjectActions } from './project-actions';
import { useWorkspace } from '@renderer/hooks/use-workspace';

interface ProjectListProps {
    projects: ProjectData[];
    workspaceId?: string;
    onEdit?: (project: ProjectData) => void;
    onDelete?: (prompt: boolean) => void;
}

export function ProjectList({ projects, onEdit, onDelete }: ProjectListProps) {
    const handleProjectClick = (project: ProjectData) => {
        saveOrOpenProject(project);
    };

    const {
        workspace,
        actions: { saveOrOpenProject },
    } = useWorkspace();

    return (
        <div className="rounded-md border overflow-hidden">
            <Table className="compact-table">
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Framework</TableHead>
                        <TableHead>Dependencies</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {projects.map((project) => (
                        <TableRow
                            key={project.id}
                            className="hover:bg-muted/50 group cursor-pointer"
                            onClick={() => handleProjectClick(project)}
                        >
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-1.5">
                                    <ProjectIcon project={project} />
                                    <div>
                                        <div className="text-xs">
                                            {project.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {project.config?.description}
                                        </div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-xs">
                                {project.framework}
                            </TableCell>
                            <TableCell>
                                <Dependency
                                    dependsOn={project.dependsOn}
                                    isTable
                                />
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                                {project.updatedAt &&
                                    formatDistanceToNow(
                                        new Date(project.updatedAt),
                                        { addSuffix: true }
                                    )}
                            </TableCell>
                            <TableCell>
                                <ProjectActions
                                    project={project}
                                    basePath={workspace.path}
                                    onDelete={(success) => onDelete?.(success)}
                                    onEdit={
                                        onEdit
                                            ? () => onEdit(project)
                                            : undefined
                                    }
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
