import { IGRPBadgePrimitive } from '@igrp/igrp-framework-react-design-system'
import { cn } from '@renderer/lib/utils'
import { useTranslation } from 'react-i18next'
import { getServiceColor } from '../services'

interface DependencyConfig {
    condition?: string
}

interface DependencyProps {
    dependsOn?: Array<string | Record<string, DependencyConfig>>
    isTable?: boolean
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
                        <IGRPBadgePrimitive
                            key={`${dependency}-${i}`}
                            variant="outline"
                            className={cn(
                                'w-full md:max-w-50 truncate whitespace-nowrap inline-block rounded-lg text-xs font-medium',
                                getServiceColor(dependency)
                            )}
                        >
                            {dependency}
                        </IGRPBadgePrimitive>
                    )
                }

                // Handle object dependencies
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                return Object.entries(dependency).map(([depId, _config]) => (
                    <IGRPBadgePrimitive
                        key={`${depId}-${i}`}
                        variant="outline"
                        className="text-xs truncate overflow-hidden text-ellipsis  wrap-break-word"
                    >
                        {depId}
                        {/*  {config?.condition ? ` (${config.condition})` : ''} */}
                    </IGRPBadgePrimitive>
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
