'use client';

import {
    IGRPTablePrimitive,
    IGRPTableBodyPrimitive,
    IGRPTableCellPrimitive,
    IGRPTableHeadPrimitive,
    IGRPTableHeaderPrimitive,
    IGRPTableRowPrimitive,
    IGRPBadgePrimitive,
} from '@igrp/igrp-framework-react-design-system';
import { formatDistanceToNow } from 'date-fns';
import { ProjectData, ServiceInfo } from 'src/main/types';
import { ProjectIcon } from '@renderer/components/shared-ui';
import Dependency from '../components/dependency';
import { ProjectActions } from './project-actions';
import { useWorkspace } from '@renderer/hooks/use-workspace';
import { useTranslation } from 'react-i18next';

interface ProjectListProps {
    projects: ProjectData[];
    workspaceId?: string;
    services: ServiceInfo[];
}

export function ProjectList({ projects, services }: ProjectListProps) {
    const handleProjectClick = (project: ProjectData) => {
        saveOrOpenProject({ project });
    };

    const { t } = useTranslation();

    const {
        workspace,
        actions: { saveOrOpenProject },
    } = useWorkspace();

    return (
        <div className="rounded-md border overflow-hidden">
            <IGRPTablePrimitive className="compact-table">
                <IGRPTableHeaderPrimitive>
                    <IGRPTableRowPrimitive>
                        <IGRPTableHeadPrimitive>
                            {t('name')}
                        </IGRPTableHeadPrimitive>
                        <IGRPTableHeadPrimitive>
                            {t('framework')}
                        </IGRPTableHeadPrimitive>
                        <IGRPTableHeadPrimitive>
                            {t('dependencies')}
                        </IGRPTableHeadPrimitive>
                        <IGRPTableHeadPrimitive>
                            {t('lastUpdated')}
                        </IGRPTableHeadPrimitive>
                        <IGRPTableHeadPrimitive className="w-[80px]"></IGRPTableHeadPrimitive>
                    </IGRPTableRowPrimitive>
                </IGRPTableHeaderPrimitive>
                <IGRPTableBodyPrimitive>
                    {projects.map((project) => (
                        <IGRPTableRowPrimitive
                            key={project.id}
                            className="hover:bg-muted/50 group cursor-pointer"
                            onClick={() => handleProjectClick(project)}
                        >
                            <IGRPTableCellPrimitive className="font-medium">
                                <div className="flex items-center gap-1.5">
                                    <ProjectIcon
                                        project={project}
                                        workspacePath={workspace.path}
                                    />
                                    <div>
                                        <div className="text-xs">
                                            {project.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {project.config?.description}
                                        </div>
                                    </div>
                                </div>
                            </IGRPTableCellPrimitive>
                            <IGRPTableCellPrimitive className="text-xs">
                                <IGRPBadgePrimitive>
                                    {project.framework}
                                </IGRPBadgePrimitive>
                            </IGRPTableCellPrimitive>
                            <IGRPTableCellPrimitive>
                                <Dependency
                                    dependsOn={project.dependsOn}
                                    isTable
                                />
                            </IGRPTableCellPrimitive>
                            <IGRPTableCellPrimitive className="text-muted-foreground text-xs">
                                {project.updatedAt &&
                                    formatDistanceToNow(
                                        new Date(project.updatedAt),
                                        { addSuffix: true }
                                    )}
                            </IGRPTableCellPrimitive>
                            <IGRPTableCellPrimitive>
                                <ProjectActions
                                    project={project}
                                    projects={projects}
                                    basePath={workspace.path}
                                    services={services}
                                />
                            </IGRPTableCellPrimitive>
                        </IGRPTableRowPrimitive>
                    ))}
                </IGRPTableBodyPrimitive>
            </IGRPTablePrimitive>
        </div>
    );
}
