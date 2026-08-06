import type { ComponentRegisterConfig } from '@igrp/igrp-studio-nextjs-engine/types'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@renderer/components/ui/select'
import { resolveIcon } from '@renderer/features/component-icons'
import { CheckboxInput } from '@renderer/generators/api/components/inputs-form'
import { type ChangeEvent, createElement, memo, useId } from 'react'
import { useTranslation } from 'react-i18next'

interface ComponentIdentitySectionProps {
    label?: string
    componentName?: string
    componentId?: string
    tag?: string
    isRootComponent: boolean
    useClient: boolean
    /** Same-group components this one can convert to (empty → no selector). */
    switchTargets?: ComponentRegisterConfig[]
    onSwitchComponent?: (targetName: string) => void
    onTagChange: (e: ChangeEvent<HTMLInputElement>) => void
    onUseClientChange: (value: boolean) => void
}

const ComponentIdentitySection = memo(function ComponentIdentitySection({
    label,
    componentName,
    componentId,
    tag,
    isRootComponent,
    useClient,
    switchTargets = [],
    onSwitchComponent,
    onTagChange,
    onUseClientChange
}: ComponentIdentitySectionProps) {
    const { t } = useTranslation()
    const idTag = useId()
    const idUseClient = useId()
    const idSwitch = useId()

    return (
        <>
            <div className="space-y-2">
                <Label htmlFor={'tab'}>{`${label || componentName} - ${componentId}`}</Label>
                <Input id={idTag} value={tag} onChange={onTagChange} />
            </div>
            {switchTargets.length > 0 && onSwitchComponent && componentName && (
                <div className="space-y-2">
                    <Label htmlFor={idSwitch}>{t('switchComponent')}</Label>
                    <Select value={componentName} onValueChange={onSwitchComponent}>
                        <SelectTrigger id={idSwitch} className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {/* current first, then the same-group targets */}
                            <SelectItem value={componentName}>
                                <span className="flex items-center gap-2">
                                    {createElement(resolveIcon(componentName), {
                                        className: 'h-4 w-4 text-muted-foreground'
                                    })}
                                    {label || componentName}
                                </span>
                            </SelectItem>
                            {switchTargets.map((target) => (
                                <SelectItem key={target.name} value={target.name}>
                                    <span className="flex items-center gap-2">
                                        {createElement(resolveIcon(target.name), {
                                            className: 'h-4 w-4 text-muted-foreground'
                                        })}
                                        {target.label || target.name}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
            {isRootComponent && (
                <CheckboxInput
                    id={idUseClient}
                    label={t('useClient')}
                    onChange={onUseClientChange}
                    value={useClient}
                    info={t('useClientInfo')}
                />
            )}
        </>
    )
})

export default ComponentIdentitySection
