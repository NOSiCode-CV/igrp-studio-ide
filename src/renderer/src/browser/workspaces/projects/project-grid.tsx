import { Badge } from '@renderer/components/ui/badge'
import { Card } from '@renderer/components/ui/card'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@renderer/components/ui/hover-card'
import { ProjectIcon } from '@renderer/components/shared-ui'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import { getLocale } from '@renderer/utils'
import { formatDistanceToNow } from 'date-fns'
import { Clock } from 'lucide-react'
import path from 'path'
import type { ProjectData, ServiceInfo } from 'src/main/types'
import { ProjectActions } from './project-actions'

interface ProjectProps {
    projects: ProjectData[]
    workspaceId: string
    projectOrder: string
    services: ServiceInfo[]
}

// Character threshold above which a single dependency name is considered
// "long" — i.e. likely to truncate in the `max-w-[140px]` chip, so it's
// worth wrapping in a HoverCard so the user can see the full value.
const LONG_DEP_NAME_CHARS = 18

// Dependencies may be plain service names or `{ name: { condition } }` objects.
const getDependencyNames = (dependsOn: unknown[]): string[] =>
    dependsOn
        .map((dep) =>
            typeof dep === 'string'
                ? dep
                : dep && typeof dep === 'object'
                  ? Object.keys(dep as Record<string, unknown>)[0]
                  : undefined
        )
        .filter((name): name is string => Boolean(name))

const ProjectGrid = ({ projects, projectOrder, services }: ProjectProps) => {
    const {
        workspace,
        actions: { saveOrOpenProject }
    } = useWorkspace()

    const handleOpenProject = (project: ProjectData): void => {
        saveOrOpenProject({ project, openProject: true })
    }

    const sortProjects = (list: ProjectData[]): ProjectData[] => {
        return [...list].sort((a, b) => {
            if (projectOrder === 'name') {
                return (a.name || '').localeCompare(b.name || '')
            } else if (projectOrder === 'lastModified') {
                return (
                    new Date(b.config?.lastModified ?? 0).getTime() -
                    new Date(a.config?.lastModified ?? 0).getTime()
                )
            } else if (projectOrder === 'framework') {
                return (a.framework || '').localeCompare(b.framework || '')
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
        <div
            className="grid gap-3"
            style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}
        >
            {sortProjects(projects).map((project, index) => {
                const service = findServiceByProjectName(project)
                const dependencyNames = getDependencyNames(service?.dependsOn ?? [])
                const ports = service?.ports ?? []
                const description = project.config?.description
                const firstDep = dependencyNames[0] ?? ''
                // Only wrap deps in a HoverCard when there's something worth
                // expanding: more than one dep, OR a single name long enough
                // to truncate in the chip.
                const shouldExpandDeps =
                    dependencyNames.length > 1 || firstDep.length > LONG_DEP_NAME_CHARS

                return (
                    <Card
                        key={project.id ?? index}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleOpenProject(project)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                handleOpenProject(project)
                            }
                        }}
                        className="group flex h-[130px] cursor-pointer flex-col justify-between gap-0 rounded-[8px] p-3 transition-all hover:border-primary hover:shadow-md focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                    >
                        {/* Header: icon + title + description / port */}
                        <div className="flex w-full min-w-0 items-start gap-2">
                            <ProjectIcon
                                project={project}
                                workspacePath={workspace?.path || ''}
                                className="border shadow-sm transition-colors group-hover:border-primary/40"
                            />
                            <div className="flex min-w-0 flex-1 flex-col pt-0.5">
                                <h4 className="truncate text-sm font-semibold leading-tight tracking-tight text-foreground transition-colors group-hover:text-primary">
                                    {project.name}
                                </h4>
                                <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
                                    {description && (
                                        <span
                                            className="truncate text-[10px] font-medium text-muted-foreground"
                                            title={description}
                                        >
                                            {description}
                                        </span>
                                    )}
                                    {ports[0] && (
                                        <>
                                            {description && (
                                                <span className="text-[10px] text-muted-foreground/40">
                                                    |
                                                </span>
                                            )}
                                            <span className="whitespace-nowrap text-[10px] font-semibold lowercase tracking-tight text-emerald-600">
                                                {ports[0]}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Dependencies */}
                        <div className="mt-3 mb-1 flex items-center justify-start">
                            {dependencyNames.length === 0 ? (
                                <div className="h-5" />
                            ) : shouldExpandDeps ? (
                                <HoverCard openDelay={120} closeDelay={80}>
                                    <HoverCardTrigger asChild>
                                        <div
                                            className="flex items-center gap-1"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Badge
                                                variant="outline"
                                                className="h-5 max-w-[140px] rounded-md bg-muted/40 px-2 text-[10px] font-semibold text-muted-foreground"
                                            >
                                                <span className="min-w-0 truncate">
                                                    {firstDep}
                                                </span>
                                            </Badge>
                                            {dependencyNames.length > 1 && (
                                                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border bg-muted px-1 text-[10px] font-bold text-muted-foreground">
                                                    +{dependencyNames.length - 1}
                                                </span>
                                            )}
                                        </div>
                                    </HoverCardTrigger>
                                    <HoverCardContent align="start" className="w-auto max-w-[240px] p-2">
                                        <div className="flex flex-wrap gap-1">
                                            {dependencyNames.map((name, i) => (
                                                <Badge
                                                    key={`${name}-${i}`}
                                                    variant="secondary"
                                                    className="text-[10px]"
                                                >
                                                    {name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </HoverCardContent>
                                </HoverCard>
                            ) : (
                                // Single, short dep — plain chip, no hover.
                                <Badge
                                    variant="outline"
                                    className="h-5 max-w-[140px] rounded-md bg-muted/40 px-2 text-[10px] font-semibold text-muted-foreground"
                                    title={firstDep}
                                >
                                    <span className="min-w-0 truncate">{firstDep}</span>
                                </Badge>
                            )}
                        </div>

                        {/* Footer: updated + actions */}
                        <div className="mt-auto flex items-center justify-between border-t border-border/30 pt-2">
                            <div className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                                {project.updatedAt && (
                                    <>
                                        <Clock className="h-3 w-3 shrink-0" />
                                        <span className="truncate text-[11px]">
                                            {formatDistanceToNow(project.updatedAt, {
                                                addSuffix: true,
                                                locale: getLocale()
                                            })}
                                        </span>
                                    </>
                                )}
                            </div>
                            <div onClick={(e) => e.stopPropagation()}>
                                <ProjectActions
                                    project={project}
                                    projects={projects}
                                    basePath={workspace?.path || ''}
                                    services={services}
                                    triggerClassName="opacity-100 text-muted-foreground data-[state=open]:bg-muted data-[state=open]:text-primary"
                                />
                            </div>
                        </div>
                    </Card>
                )
            })}
        </div>
    )
}

export default ProjectGrid
