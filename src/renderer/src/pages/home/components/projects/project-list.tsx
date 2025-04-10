'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@renderer/components/ui/table';
import { Badge } from '@renderer/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@renderer/components/ui/button';
import { ExternalLink, Edit } from 'lucide-react';
import { ProjectData } from 'src/main/types';
import { ProjectIcon } from '@renderer/components/shared-ui';
import Dependency from '../dependency';

interface ProjectListProps {
    projects: ProjectData[];
    onEdit?: (project: ProjectData) => void;
    workspaceId?: string;
}

export function ProjectList({
    projects,
    onEdit,
}: ProjectListProps) {
    const handleProjectClick = (project: ProjectData) => {};

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
                                <div className="flex items-center gap-1">
                                    {onEdit && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(project);
                                            }}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
