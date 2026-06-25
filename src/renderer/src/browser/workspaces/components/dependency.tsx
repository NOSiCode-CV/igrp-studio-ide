import { Badge } from '@renderer/components/ui/badge'
import { cn } from '@renderer/lib/utils'
import { Layers } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
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

type PopoverAlign = 'left' | 'right'

const DEPENDENCY_POPOVER_WIDTH = 280
const VIEWPORT_SAFE_MARGIN = 16

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
    const [isPopoverOpen, setIsPopoverOpen] = useState(false)
    const [popoverAlign, setPopoverAlign] = useState<PopoverAlign>('left')
    const rootRef = useRef<HTMLDivElement | null>(null)

    const resolvePopoverAlign = useCallback(() => {
        const root = rootRef.current
        if (!root) {
            setPopoverAlign('left')
            return
        }

        const rect = root.getBoundingClientRect()
        const overflowRight =
            rect.left + DEPENDENCY_POPOVER_WIDTH > window.innerWidth - VIEWPORT_SAFE_MARGIN
        setPopoverAlign(overflowRight ? 'right' : 'left')
    }, [])

    const openPopover = (): void => {
        if (hiddenCount <= 0) return
        resolvePopoverAlign()
        setIsPopoverOpen(true)
    }

    const closePopover = (): void => {
        setIsPopoverOpen(false)
    }

    useEffect(() => {
        if (!isPopoverOpen) return

        const handleResize = (): void => {
            resolvePopoverAlign()
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [isPopoverOpen, resolvePopoverAlign])

    return (
        <div
            ref={rootRef}
            className={cn('relative min-w-0', className)}
            onMouseEnter={openPopover}
            onMouseLeave={closePopover}
        >
            <div
                className={cn(
                    'flex min-w-0 items-center gap-1.5 overflow-hidden transition-opacity duration-150',
                    hiddenCount > 0 && isPopoverOpen ? 'opacity-0' : 'opacity-100'
                )}
            >
                <Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                {dependencies.length === 0 ? (
                    <span className="text-xs text-muted-foreground">{t('none')}</span>
                ) : (
                    <>
                        <span className="min-w-0 truncate rounded-md border bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            {primaryDependency}
                        </span>
                        {hiddenCount > 0 ? (
                            <span className="shrink-0 rounded-md border bg-card px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">
                                +{hiddenCount}
                            </span>
                        ) : null}
                    </>
                )}
            </div>

            {hiddenCount > 0 ? (
                <div
                    className={cn(
                        'absolute top-0 z-40 flex max-h-[220px] w-max min-w-[160px] max-w-[280px] flex-col gap-1 overflow-y-auto overscroll-contain rounded-xl border bg-popover p-2 shadow-xl transition duration-150 ease-out',
                        popoverAlign === 'right' ? 'right-0' : 'left-0',
                        isPopoverOpen
                            ? 'pointer-events-auto scale-100 opacity-100'
                            : 'pointer-events-none scale-95 opacity-0'
                    )}
                >
                    {dependencies.map((dependency, index) => (
                        <span
                            key={`${dependency}-${index}`}
                            title={dependency}
                            className="truncate rounded-md border bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground"
                        >
                            {dependency}
                        </span>
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
