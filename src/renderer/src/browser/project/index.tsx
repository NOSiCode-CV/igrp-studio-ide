import { Button } from '@renderer/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { FrameworkIcon } from '@renderer/components/framework-icon'
import { ContainerScrollArea } from '@renderer/generators/api/components/ContainerScrollArea'
import { cn } from '@renderer/lib/utils'
import { useTranslation } from 'react-i18next'
import type { ProjectData } from 'src/main/types'

interface PageProps {
    basePath?: string
    project?: ProjectData
    className?: string
    hasTitle?: boolean
    /** Compact layout for narrow sidebars (skips outer ContainerScrollArea). */
    embedded?: boolean
}

interface SettingsRowProps {
    label: string
    value: React.ReactNode
    description?: React.ReactNode
    onEdit?: () => void
    compact?: boolean
}

function SettingsRow({ label, value, description, onEdit, compact }: SettingsRowProps) {
    const { t } = useTranslation()

    return (
        <div
            className={cn(
                'flex justify-between py-4',
                compact ? 'flex-col items-start gap-1.5' : 'items-start'
            )}
        >
            <div
                className={cn(
                    'flex flex-1',
                    compact ? 'flex-col items-start gap-1' : 'items-center space-x-6'
                )}
            >
                <p className="text-sm font-medium leading-none">{t(label)}</p>
                <div className="flex items-center gap-2 break-all text-muted-foreground">{value}</div>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit} className="hidden">
                    {t('edit')}
                </Button>
            )}
        </div>
    )
}

export default function ProjectSettings({
    project,
    className,
    hasTitle = true,
    embedded = false
}: PageProps) {
    const { t } = useTranslation()

    if (!project) return null
    const { name, framework, config } = project

    const content = (
        <div
            className={cn(
                'w-full space-y-8',
                embedded ? 'max-w-none space-y-4 p-3' : 'mx-auto mb-10 max-w-3xl p-6',
                className
            )}
        >
            {hasTitle && (
                <h1 className={cn('font-semibold', embedded ? 'text-lg' : 'text-3xl')}>
                    {t('basic_settings')}
                </h1>
            )}

            <Card className="border-border/50">
                <CardHeader className={cn(embedded && 'px-3 py-3')}>
                    <CardTitle className={cn(embedded && 'text-sm')}>{t('general_info')}</CardTitle>
                </CardHeader>
                <CardContent
                    className={cn(
                        'space-y-0 divide-y divide-border/50',
                        embedded && 'px-3 pb-3'
                    )}
                >
                    <SettingsRow compact={embedded} label="project_name" value={name} />
                    <SettingsRow
                        compact={embedded}
                        label="icon"
                        value={
                            <FrameworkIcon
                                framework={framework as any}
                                size={16}
                                className="h-12 w-12 rounded-lg bg-muted p-2"
                                alt={`${project.framework} logo`}
                            />
                        }
                    />
                    <SettingsRow compact={embedded} label="framework" value={framework} />
                    {Object.keys(config || {}).map((key) => (
                        <SettingsRow
                            key={key}
                            compact={embedded}
                            label={key}
                            value={String(config[key] ?? '')}
                        />
                    ))}
                </CardContent>
            </Card>
        </div>
    )

    if (embedded) return content

    return <ContainerScrollArea>{content}</ContainerScrollArea>
}
