import { IGRPInputPrimitive, IGRPLabelPrimitive } from '@igrp/igrp-framework-react-design-system'
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
                <IGRPLabelPrimitive htmlFor={'tab'}>
                    {`${label || componentName} - ${componentId}`}
                </IGRPLabelPrimitive>
                <IGRPInputPrimitive id={idTag} value={tag} onChange={onTagChange} />
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
