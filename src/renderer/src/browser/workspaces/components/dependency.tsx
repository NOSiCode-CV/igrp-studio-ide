import { Badge } from '@renderer/components/ui/badge'
import { cn } from '@renderer/lib/utils'
import { Layers } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getServiceColor } from '../services'

interface DependencyConfig {
    condition?: string
}

interface DependencyProps {
    dependsOn?: Array<string | Record<string, DependencyConfig>>
    isTable?: boolean
}

interface DependencySummaryProps {
    dependsOn?: Array<string | Record<string, DependencyConfig>>
    className?: string
}

const normalizeDependencies = (
    dependsOn?: Array<string | Record<string, DependencyConfig>>
): string[] => {
    if (!dependsOn || dependsOn.length === 0) return []
    return dependsOn.flatMap((dependency) => {
        if (typeof dependency === 'string') return [dependency]
        return Object.keys(dependency || {})
    })
}

export const DependencySummary = ({ dependsOn, className = '' }: DependencySummaryProps) => {
    const { t } = useTranslation()
    const dependencies = normalizeDependencies(dependsOn)
    const primaryDependency = dependencies[0]
    const hiddenCount = Math.max(dependencies.length - 1, 0)

    return (
        <div className={cn('group/deps relative min-w-0', className)}>
            <div className="flex min-w-0 items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 shrink-0 text-slate-300 dark:text-slate-600" />
                {dependencies.length === 0 ? (
                    <span className="text-xs text-slate-400 dark:text-slate-500">{t('none')}</span>
                ) : (
                    <>
                        <Badge
                            variant="outline"
                            className="max-w-[130px] truncate border-blue-100 bg-blue-50 text-xs font-medium text-blue-700 dark:border-blue-900/70 dark:bg-blue-900/30 dark:text-blue-300"
                        >
                            {primaryDependency}
                        </Badge>
                        {hiddenCount > 0 ? (
                            <Badge
                                variant="outline"
                                className="shrink-0 border-blue-100 bg-blue-50 text-xs font-semibold text-blue-700 dark:border-blue-900/70 dark:bg-blue-900/30 dark:text-blue-300"
                            >
                                +{hiddenCount}
                            </Badge>
                        ) : null}
                    </>
                )}
            </div>

            {hiddenCount > 0 ? (
                <div className="absolute top-full left-0 z-30 mt-1 hidden max-w-[420px] min-w-max items-center gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white px-2 py-1.5 shadow-[0_14px_40px_-12px_rgba(15,23,42,0.35)] group-hover/deps:flex dark:border-slate-700 dark:bg-slate-900">
                    {dependencies.map((dependency, index) => (
                        <Badge
                            key={`${dependency}-${index}`}
                            variant="outline"
                            className="shrink-0 border-blue-100 bg-blue-50 text-xs font-medium text-blue-700 dark:border-blue-900/70 dark:bg-blue-900/30 dark:text-blue-300"
                        >
                            {dependency}
                        </Badge>
                    ))}
                </div>
            ) : null}
        </div>
    )
}

const Dependency = ({ dependsOn, isTable = false }: DependencyProps) => {
    const { t } = useTranslation()
    if (!dependsOn || dependsOn.length === 0) return null

    const content = (
        <>
            {dependsOn.flatMap((dependency, i) => {
                // Handle string dependencies
                if (typeof dependency === 'string') {
                    return (
                        <Badge
                            key={`${dependency}-${i}`}
                            variant="outline"
                            className={cn(
                                'w-full md:max-w-50 truncate whitespace-nowrap inline-block rounded-lg text-xs font-medium',
                                getServiceColor(dependency)
                            )}
                        >
                            {dependency}
                        </Badge>
                    )
                }

                // Handle object dependencies
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                return Object.entries(dependency).map(([depId, _config]) => (
                    <Badge
                        key={`${depId}-${i}`}
                        variant="outline"
                        className="text-xs truncate overflow-hidden text-ellipsis  wrap-break-word"
                    >
                        {depId}
                        {/*  {config?.condition ? ` (${config.condition})` : ''} */}
                    </Badge>
                ))
            })}
        </>
    )

    return (
        <>
            {isTable ? (
                <div className="flex flex-wrap gap-1"> {content}</div>
            ) : (
                <div className="py-1">
                    <div className="text-xs text-muted-foreground">{t('dependsOn')}</div>
                    <div className="text-xs font-mono flex flex-wrap gap-1 mt-0.5">{content}</div>
                </div>
            )}
        </>
    )
}

export default Dependency
