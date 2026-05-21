'use client'

import { Button } from '@renderer/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@renderer/components/ui/dropdown-menu'
import AlertDialogDelete from '@renderer/components/alert-dialog-delete'
import { ENV_TYPES } from '@renderer/constants/appConstants'
import { useDocker } from '@renderer/hooks/use-docker'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import useToast from '@renderer/hooks/useToast'
import { Edit, ExternalLink, MoreVertical, Repeat, Rocket, Trash } from 'lucide-react'
import path from 'path'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ProjectData, ServiceInfo } from 'src/main/types'
import { ConfigurationDialog } from '../components/configuration-dialog'
import { EditProjectModal } from './edit-project-modal'

interface ProjectDropdownProps {
    project: ProjectData
    basePath: string
    services?: ServiceInfo[]
    projects?: ProjectData[]
    onConvertToSpringBoot?: () => void
    onConvertToDotNet?: () => void
}

export const ProjectActions: React.FC<ProjectDropdownProps> = ({
    project,
    services = [],
    projects = [],
    onConvertToSpringBoot,
    onConvertToDotNet
}) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const { showErrorToast } = useToast()
    const { t } = useTranslation()

    const {
        workspace,
        actions: { removeProject }
    } = useWorkspace()
    const { getProjectBrowserUrl } = useDocker({ workspace })

    const handleDelete = async () => {
        try {
            await removeProject(project)
            setIsDialogOpen(false)
        } catch (error: unknown) {
            showErrorToast(error)
        }
    }

    const handleExternalLink = () => {
        const url = getProjectBrowserUrl(project, service)
        if (!url) return
        window.open(url, '_blank')
    }

    const handleDeployDocker = async () => {
        try {
            if (window.igrpStudio.docker.deployProject) {
                await window.igrpStudio.docker.deployProject(project.path)
                return
            }

            if (window.electron?.ipcRenderer?.invoke) {
                try {
                    await window.electron.ipcRenderer.invoke('docker-deploy-project', project.path)
                    return
                } catch (error) {
                    if (
                        error instanceof Error &&
                        !error.message.includes("No handler registered for 'docker-deploy-project'")
                    ) {
                        throw error
                    }
                }
            }

            await window.igrpStudio.docker.up(project.path)
        } catch (error: unknown) {
            showErrorToast(error)
        }
    }

    const handleEditProject = () => {
        setIsEditModalOpen(true)
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

    const service = findServiceByProjectName(project)

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="min-w-48">
                    <DropdownMenuItem onClick={handleEditProject}>
                        <Edit className="mr-2 h-4 w-4" />
                        {t('editProject')}
                    </DropdownMenuItem>

                    {getProjectBrowserUrl(project, service) && (
                        <DropdownMenuItem onClick={handleExternalLink}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            {t('openInBrowser')}
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuItem onClick={handleDeployDocker}>
                        <Rocket className="mr-2 h-4 w-4" />
                        Deploy Docker
                    </DropdownMenuItem>

                    {project.framework === ENV_TYPES.DOTNET && (
                        <DropdownMenuItem onClick={onConvertToSpringBoot} disabled>
                            <Repeat className="mr-2 h-4 w-4 text-gray-500" />
                            {t('convertToSpringBoot')}
                            <span className="ml-auto text-xs text-muted-foreground">
                                {t('comingSoon')}
                            </span>
                        </DropdownMenuItem>
                    )}

                    {project.framework === ENV_TYPES.SPRING && (
                        <DropdownMenuItem onClick={onConvertToDotNet} disabled>
                            <Repeat className="mr-2 h-4 w-4 text-gray-500" />
                            {t('convertToDotNet')}
                            <span className="ml-auto text-xs text-muted-foreground">
                                {t('comingSoon')}
                            </span>
                        </DropdownMenuItem>
                    )}

                    {service && (
                        <ConfigurationDialog
                            service={service}
                            services={services}
                            projects={projects}
                            isNew={false}
                            project={project}
                        >
                            <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="focus:bg-accent"
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                {t('configureService')}
                            </DropdownMenuItem>
                        </ConfigurationDialog>
                    )}
                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                        onClick={() => {
                            setIsDialogOpen(true)
                        }}
                    >
                        <Trash className="mr-2 h-4 w-4 text-red-600" />
                        {t('removeProject')}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialogDelete
                onConfirm={handleDelete}
                onClose={() => setIsDialogOpen(false)}
                recordId={project.name}
                isOpen={isDialogOpen}
            />

            <EditProjectModal
                project={project}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={() => {
                    // Trigger data refresh without hard reloading the renderer process.
                    window.dispatchEvent(new Event('igrp:workspace:refresh'))
                }}
            />
        </>
    )
}
