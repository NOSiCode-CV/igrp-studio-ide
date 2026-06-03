/**
 * biome-ignore-all lint/a11y/useSemanticElements: LD3 — this view deliberately uses CSS grid with ARIA roles (role="table" / "row" / "columnheader" / "cell" / "rowgroup") instead of a semantic <table>, because <table> can't render the fluid `minmax(0, 1fr)` template with proper truncation that the redesign needs. See specs/features/studio-ide-ui-redesign-02/projects-view/decisions.md.
 * biome-ignore-all lint/a11y/useFocusableInteractive: header rows / columnheaders / cells are labels, not interactive controls; only each project ROW is interactive and it already has tabIndex={0} + onKeyDown for keyboard support.
 */

'use client'

import { Badge } from '@renderer/components/ui/badge'
import { FrameworkIcon, type FrameworkType } from '@renderer/components/framework-icon'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@renderer/components/ui/hover-card'
import { ProjectIcon } from '@renderer/components/shared-ui'
import { useWorkspace } from '@renderer/hooks/use-workspace'
import {
    backendFrameworks,
    frontendFrameworks,
    specificationFrameworks
} from '@renderer/browser/project/data'
import { Database } from 'lucide-react'
import path from 'path'
import { useTranslation } from 'react-i18next'
import type { ProjectData, ServiceInfo } from 'src/main/types'
import { ProjectActions } from './project-actions'

// Resolves a framework id (e.g. 'springboot') to its display name
// ('Spring Boot') by looking it up in the same arrays the New Project wizard
// uses, so labels stay consistent across the app.
const FRAMEWORK_LABELS: Record<string, string> = Object.fromEntries(
    [...frontendFrameworks, ...backendFrameworks, ...specificationFrameworks].map((f) => [
        f.id,
        f.name
    ])
)
const getFrameworkLabel = (id: string | undefined): string =>
    (id && FRAMEWORK_LABELS[id]) || id || ''

interface ProjectListProps {
    projects: ProjectData[]
    workspaceId?: string
    services: ServiceInfo[]
}

// Shared 6-column template so the header and every row line up.
const COLUMNS_STYLE = {
    gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) 80px 36px'
}

// Character threshold above which a single dependency name is considered
// "long" — i.e. likely to truncate in the chip, so it's worth wrapping in a
// HoverCard so the user can see the full value.
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

// Compact relative time: now / 5m / 16h / 3d / 2w / 4mo / 1y
const shortenTime = (value: string | number | Date): string => {
    const then = new Date(value).getTime()
    if (Number.isNaN(then)) return ''
    const sec = Math.max(0, Math.floor((Date.now() - then) / 1000))
    if (sec < 60) return 'now'
    const min = Math.floor(sec / 60)
    if (min < 60) return `${min}m`
    const hr = Math.floor(min / 60)
    if (hr < 24) return `${hr}h`
    const day = Math.floor(hr / 24)
    if (day < 7) return `${day}d`
    if (day < 30) return `${Math.floor(day / 7)}w`
    if (day < 365) return `${Math.floor(day / 30)}mo`
    return `${Math.floor(day / 365)}y`
}

export function ProjectList({ projects, services }: ProjectListProps) {
    const { t } = useTranslation()
    const {
        workspace,
        actions: { saveOrOpenProject }
    } = useWorkspace()

    const handleProjectClick = (project: ProjectData): void => {
        saveOrOpenProject({ project })
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
        <div role="table" className="w-full text-xs">
            {/* Header */}
            <div
                role="row"
                style={COLUMNS_STYLE}
                className="grid items-center gap-2 border-b px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
            >
                <div role="columnheader" className="px-1">
                    {t('projectName')}
                </div>
                <div role="columnheader">{t('framework')}</div>
                <div role="columnheader">{t('ports')}</div>
                <div role="columnheader">{t('dependencies')}</div>
                <div role="columnheader" className="text-center">
                    {t('updated')}
                </div>
                <div role="columnheader" aria-hidden="true" />
            </div>

            {/* Rows */}
            <div role="rowgroup" className="divide-y divide-border">
                {projects.map((project, index) => {
                    const service = findServiceByProjectName(project)
                    const dependencyNames = getDependencyNames(service?.dependsOn ?? [])
                    const port = service?.ports?.[0]
                    const firstDep = dependencyNames[0] ?? ''
                    // Only wrap deps in a HoverCard when there's something worth
                    // expanding: more than one dep, OR a single name long enough
                    // to truncate in the chip.
                    const shouldExpandDeps =
                        dependencyNames.length > 1 || firstDep.length > LONG_DEP_NAME_CHARS

                    return (
                        <div
                            key={project.id ?? index}
                            role="row"
                            tabIndex={0}
                            onClick={() => handleProjectClick(project)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    handleProjectClick(project)
                                }
                            }}
                            style={COLUMNS_STYLE}
                            className="group grid cursor-pointer items-center gap-2 px-2 py-2.5 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                        >
                            {/* Project name */}
                            <div role="cell" className="flex min-w-0 items-center gap-2 px-1">
                                <ProjectIcon
                                    project={project}
                                    workspacePath={workspace?.path || ''}
                                    className="h-7 w-7"
                                />
                                <span className="truncate font-medium text-foreground">
                                    {project.name}
                                </span>
                            </div>

                            {/* Framework */}
                            <div role="cell" className="min-w-0">
                                {project.framework && (
                                    <Badge
                                        variant="secondary"
                                        className="h-5 max-w-[140px] gap-1 rounded-md px-1.5 py-0 text-[10px] font-medium"
                                    >
                                        <FrameworkIcon
                                            framework={project.framework as FrameworkType}
                                            size={10}
                                            className="rounded-none shrink-0"
                                        />
                                        <span className="min-w-0 truncate">
                                            {getFrameworkLabel(project.framework)}
                                        </span>
                                    </Badge>
                                )}
                            </div>

                            {/* Ports */}
                            <div role="cell" className="min-w-0">
                                {port && (
                                    <span className="inline-flex items-center rounded-md border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground transition-colors group-hover:bg-background">
                                        {port}
                                    </span>
                                )}
                            </div>

                            {/* Dependencies (collapsed; expands on hover only when worth it) */}
                            <div role="cell" className="flex min-w-0 items-center">
                                {dependencyNames.length === 0 ? null : shouldExpandDeps ? (
                                    <HoverCard openDelay={120} closeDelay={80}>
                                        <HoverCardTrigger asChild>
                                            {/* biome-ignore lint/a11y/noStaticElementInteractions: stopPropagation shield only — the row's own keyboard handler covers a11y, this div just prevents row-click bubble */}
                                            {/* biome-ignore lint/a11y/useKeyWithClickEvents: stopPropagation has no keyboard equivalent — keyboard activation goes through the row, not this wrapper */}
                                            <div
                                                className="flex min-w-0 items-center gap-1"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <span className="inline-flex min-w-0 max-w-[160px] items-center gap-1 rounded-md border bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                                    <Database className="h-2.5 w-2.5 shrink-0" />
                                                    <span className="min-w-0 truncate">
                                                        {firstDep}
                                                    </span>
                                                </span>
                                                {dependencyNames.length > 1 && (
                                                    <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">
                                                        +{dependencyNames.length - 1}
                                                    </span>
                                                )}
                                            </div>
                                        </HoverCardTrigger>
                                        <HoverCardContent align="start" className="w-auto max-w-[260px] p-2">
                                            <div className="flex flex-wrap gap-1">
                                                {dependencyNames.map((name, i) => (
                                                    <span
                                                        key={`${name}-${i}`}
                                                        className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                                                    >
                                                        <Database className="h-2.5 w-2.5 shrink-0" />
                                                        {name}
                                                    </span>
                                                ))}
                                            </div>
                                        </HoverCardContent>
                                    </HoverCard>
                                ) : (
                                    // Single, short dep — plain chip, no hover.
                                    <span
                                        className="inline-flex min-w-0 max-w-[160px] items-center gap-1 rounded-md border bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                                        title={firstDep}
                                    >
                                        <Database className="h-2.5 w-2.5 shrink-0" />
                                        <span className="min-w-0 truncate">{firstDep}</span>
                                    </span>
                                )}
                            </div>

                            {/* Updated */}
                            <div
                                role="cell"
                                className="whitespace-nowrap text-center text-muted-foreground"
                            >
                                {project.updatedAt ? shortenTime(project.updatedAt) : ''}
                            </div>

                            {/* Actions (hover-revealed) */}
                            {/* biome-ignore lint/a11y/useKeyWithClickEvents: stopPropagation shield only — ProjectActions inside handles its own keyboard activation */}
                            <div
                                role="cell"
                                className="flex justify-end"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ProjectActions
                                    project={project}
                                    projects={projects}
                                    basePath={workspace?.path || ''}
                                    services={services}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
