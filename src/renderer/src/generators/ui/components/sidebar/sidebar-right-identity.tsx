import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import { CheckboxInput } from '@renderer/generators/api/components/inputs-form'
import { type ChangeEvent, memo, useId } from 'react'
import { useTranslation } from 'react-i18next'

interface ComponentIdentitySectionProps {
    label?: string
    componentName?: string
    componentId?: string
    tag?: string
    isRootComponent: boolean
    useClient: boolean
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
    onTagChange,
    onUseClientChange
}: ComponentIdentitySectionProps) {
    const { t } = useTranslation()
    const idTag = useId()
    const idUseClient = useId()

    return (
        <>
            <div className="space-y-2">
                <Label htmlFor={'tab'}>{`${label || componentName} - ${componentId}`}</Label>
                <Input id={idTag} value={tag} onChange={onTagChange} />
            </div>
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
