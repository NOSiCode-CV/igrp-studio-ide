import { Button } from '@renderer/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { ProjectIcon } from '@renderer/components/shared-ui'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import { getLocale } from '@renderer/utils'
import { formatDistanceToNow } from 'date-fns'
import { Clock, Folder } from 'lucide-react'
import path from 'path'
import { useTranslation } from 'react-i18next'
import type { ProjectData, ServiceInfo } from 'src/main/types'
import Dependency from '../components/dependency'
import { PortsBadgeList } from '../components/ports-badge-list'
import { ProjectActions } from './project-actions'

interface ProjectProps {
    projects: ProjectData[]
    workspaceId: string
    projectOrder: string
    services: ServiceInfo[]
}
const ProjectGrid = ({ projects, projectOrder, services }: ProjectProps) => {
    const {
        workspace,
        actions: { saveOrOpenProject }
    } = useWorkspace()
    const { t } = useTranslation()

    const handleOpenProject = async (project: ProjectData): Promise<void> => {
        saveOrOpenProject({ project, openProject: true })
    }

    const sortProjects = (projects: any[]) => {
        return [...projects].sort((a, b) => {
            if (projectOrder === 'name') {
                return a.name?.localeCompare(b.name)
            } else if (projectOrder === 'lastModified') {
                return (
                    new Date(b.config?.lastModified).getTime() -
                    new Date(a.config?.lastModified).getTime()
                )
            }
            return 0
        })
    }

    const findServiceByProjectName = (project: ProjectData): ServiceInfo | undefined => {
        const byUuid = services.find((service) => service.labels?.uuid === project.id)
        if (byUuid) return byUuid

        const projectName = (project.name || '').toLowerCase().trim()
        const projectDirName = path
            .basename(project.path || '')
            .toLowerCase()
            .trim()
        const candidates = [projectName, projectDirName].filter(Boolean)
        if (candidates.length === 0) return undefined
        return services.find((service) => {
            const serviceName = (service.name || '').toLowerCase()
            const composeFile = (service.composeFile || '').toLowerCase()
            const matchesCandidate = candidates.some(
                (candidate) =>
                    serviceName === candidate ||
                    serviceName.endsWith(`-${candidate}`) ||
                    serviceName.includes(`-${candidate}-`)
            )
            return composeFile.includes('igrp-projects-compose.yml') && matchesCandidate
        })
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {sortProjects(
                projects.map((project, index) => {
                    const service = findServiceByProjectName(project)
                    const dependsOn = service?.dependsOn || []
                    const ports = service?.ports || []
                    return (
                        <Card
                            key={index}
                            className="group relative gap-4 border-slate-200 bg-white py-4 transition-all duration-200 hover:border-teal-500 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-teal-600/70 dark:hover:shadow-black/25"
                        >
                            <CardHeader>
                                <CardTitle>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <div className="rounded-lg p-0.5 transition-colors duration-200 group-hover:bg-teal-50 dark:group-hover:bg-teal-900/30">
                                                <ProjectIcon
                                                    project={project}
                                                    workspacePath={workspace?.path || ''}
                                                />
                                            </div>
                                            <span className="truncate text-xs text-ellipsis transition-colors duration-200 group-hover:text-teal-700 md:max-w-40 dark:group-hover:text-teal-300">
                                                {project.name}
                                            </span>
                                        </div>
                                        <ProjectActions
                                            project={project}
                                            projects={projects}
                                            basePath={workspace?.path || ''}
                                            services={services}
                                        />
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {project.config?.description && (
                                    <p className="text-sm text-muted-foreground opacity-60 transition-opacity duration-200 group-hover:opacity-100">
                                        {project.config.description}
                                    </p>
                                )}
                                {ports.length > 0 && <PortsBadgeList ports={ports} />}
                                {ports.length > 0 && <Dependency dependsOn={dependsOn} />}
                            </CardContent>
                            <CardFooter className="flex flex-wrap text-muted-foreground justify-between gap-2">
                                <div className="text-xs flex items-center">
                                    {project.updatedAt && (
                                        <>
                                            <Clock className="w-3 h-3 mr-1" />
                                            {formatDistanceToNow(project.updatedAt, {
                                                addSuffix: true,
                                                locale: getLocale()
                                            })}
                                        </>
                                    )}
                                </div>
                                <div className="w-full grid grid-cols-1 gap-2">
                                    <Button
                                        variant={'outline'}
                                        size={'sm'}
                                        className="w-full"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            handleOpenProject(project)
                                        }}
                                    >
                                        <Folder />
                                        {t('open')}
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    )
                })
            )}
        </div>
    )
}

export default ProjectGrid
