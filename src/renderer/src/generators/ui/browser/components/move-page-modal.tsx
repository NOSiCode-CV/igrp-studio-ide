import {
    IGRPButtonPrimitive,
    IGRPCombobox,
    IGRPDialogContentPrimitive,
    IGRPDialogDescriptionPrimitive,
    IGRPDialogFooterPrimitive,
    IGRPDialogHeaderPrimitive,
    IGRPDialogPrimitive,
    IGRPDialogTitlePrimitive,
    IGRPLabelPrimitive
} from '@igrp/igrp-framework-react-design-system'
import useToast from '@renderer/hooks/useToast'
import { type JSX, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { PageDefinition } from '../page-manager'

const TOP_LEVEL_VALUE = '__top_level__'

export interface MovePageOption {
    value: string
    label: string
}

interface MovePageModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    page?: PageDefinition
    /** All pages (top-level + sub-pages) — used to build target options. */
    allPages: PageDefinition[]
}

/**
 * Move a page by changing its `parentName`. Pure metadata update — no
 * engine call, no filesystem rename. Targets that would create a cycle
 * (the page itself or any of its descendants) are filtered out.
 */
export function MovePageModal({
    isOpen,
    onClose,
    onConfirm,
    page,
    allPages
}: MovePageModalProps): JSX.Element {
    const { t } = useTranslation()
    const { showErrorToast, showSuccessToast } = useToast()
    const [target, setTarget] = useState<string>(TOP_LEVEL_VALUE)
    const [submitting, setSubmitting] = useState(false)

    // Reset target when the modal opens for a different page.
    useEffect(() => {
        if (!isOpen) return
        const currentParent = page?.content?.parentName as string | undefined
        setTarget(currentParent || TOP_LEVEL_VALUE)
    }, [isOpen, page])

    const options = useMemo<MovePageOption[]>(() => {
        if (!page) return []

        // Build the set of descendants of the page being moved so we
        // never let the user pick a target that would create a cycle.
        const descendants = new Set<string>()
        const queue = [page.pageName]
        while (queue.length) {
            const current = queue.shift()!
            descendants.add(current)
            for (const candidate of allPages) {
                if ((candidate.content?.parentName as string | undefined) === current) {
                    queue.push(candidate.pageName)
                }
            }
        }

        const result: MovePageOption[] = [
            { value: TOP_LEVEL_VALUE, label: t('move_to_top_level') }
        ]
        for (const candidate of allPages) {
            if (descendants.has(candidate.pageName)) continue
            result.push({
                value: candidate.pageName,
                label: candidate.description || candidate.pageName
            })
        }
        return result
    }, [allPages, page, t])

    const handleConfirm = async (): Promise<void> => {
        if (!page) return
        const jsonPath = page.path || page.content?.path
        if (!jsonPath) {
            showErrorToast(t('move_no_path'))
            return
        }

        const nextParent = target === TOP_LEVEL_VALUE ? null : target
        setSubmitting(true)
        try {
            const result = (await window.api.setPageParent(jsonPath, nextParent)) as {
                success: boolean
                error?: string
            }
            if (!result.success) {
                showErrorToast(result.error || t('move_failed'))
                return
            }
            showSuccessToast(t('move_succeeded'))
            onConfirm()
            onClose()
        } catch (error) {
            console.error(error)
            showErrorToast(t('move_failed'))
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <IGRPDialogPrimitive open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <IGRPDialogContentPrimitive className="sm:max-w-md">
                <IGRPDialogHeaderPrimitive>
                    <IGRPDialogTitlePrimitive>{t('move_page_title')}</IGRPDialogTitlePrimitive>
                    <IGRPDialogDescriptionPrimitive>
                        {page
                            ? t('move_page_description', {
                                  name: page.description || page.pageName
                              })
                            : ''}
                    </IGRPDialogDescriptionPrimitive>
                </IGRPDialogHeaderPrimitive>

                <div className="space-y-2 py-2">
                    <IGRPLabelPrimitive>{t('move_target')}</IGRPLabelPrimitive>
                    <IGRPCombobox
                        name="target"
                        value={target}
                        options={options}
                        placeholder={t('move_target_placeholder')}
                        onChange={(value) => {
                            const next = Array.isArray(value) ? value[0] : value
                            setTarget(next || TOP_LEVEL_VALUE)
                        }}
                    />
                </div>

                <IGRPDialogFooterPrimitive>
                    <IGRPButtonPrimitive variant="outline" onClick={onClose} disabled={submitting}>
                        {t('cancel')}
                    </IGRPButtonPrimitive>
                    <IGRPButtonPrimitive onClick={handleConfirm} disabled={submitting || !page}>
                        {t('move')}
                    </IGRPButtonPrimitive>
                </IGRPDialogFooterPrimitive>
            </IGRPDialogContentPrimitive>
        </IGRPDialogPrimitive>
    )
}
