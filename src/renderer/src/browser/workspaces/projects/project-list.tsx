'use client'

import { Badge } from '@renderer/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@renderer/components/ui/table'
import { ProjectIcon } from '@renderer/components/shared-ui'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import { formatDistanceToNow } from 'date-fns'
import { useTranslation } from 'react-i18next'
import type { ProjectData, ServiceInfo } from 'src/main/types'
import Dependency from '../components/dependency'
import { ProjectActions } from './project-actions'

interface ProjectListProps {
    projects: ProjectData[]
    workspaceId?: string
    services: ServiceInfo[]
}

export function ProjectList({ projects, services }: ProjectListProps) {
    const handleProjectClick = (project: ProjectData) => {
        saveOrOpenProject({ project })
    }

    const { t } = useTranslation()

    const {
        workspace,
        actions: { saveOrOpenProject }
    } = useWorkspace()

    return (
        <div className="rounded-md border overflow-hidden">
            <Table className="compact-table">
                <TableHeader>
                    <TableRow>
                        <TableHead>{t('name')}</TableHead>
                        <TableHead>{t('framework')}</TableHead>
                        <TableHead>{t('dependencies')}</TableHead>
                        <TableHead>{t('lastUpdated')}</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {projects.map((project) => {
                        return (
                            <TableRow
                                key={project.id}
                                className="hover:bg-muted/50 group cursor-pointer"
                                onClick={() => handleProjectClick(project)}
                            >
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-1.5">
                                        <ProjectIcon
                                            project={project}
                                            workspacePath={workspace?.path || ''}
                                        />
                                        <div>
                                            <div className="text-xs">{project.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {project.config?.description}
                                            </div>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-xs">
                                    <Badge>{project.framework}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Dependency dependsOn={project.dependsOn} isTable />
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs">
                                    {project.updatedAt &&
                                        formatDistanceToNow(new Date(project.updatedAt), {
                                            addSuffix: true
                                        })}
                                </TableCell>
                                <TableCell>
                                    <ProjectActions
                                        project={project}
                                        projects={projects}
                                        basePath={workspace?.path || ''}
                                        services={services}
                                    />
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
