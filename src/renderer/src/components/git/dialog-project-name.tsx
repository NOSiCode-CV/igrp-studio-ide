import { useState } from 'react'
import {
  IGRPDialogPrimitive,
  IGRPDialogContentPrimitive,
  IGRPDialogDescriptionPrimitive,
  IGRPDialogFooterPrimitive,
  IGRPDialogHeaderPrimitive,
  IGRPDialogTitlePrimitive
} from '@igrp/igrp-framework-react-design-system'
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system'
import { IGRPInputPrimitive } from '@igrp/igrp-framework-react-design-system'
import { useTranslation } from 'react-i18next'

export const ProjectNameDialog = ({
  isOpen,
  onClose,
  defaultName,
  onConfirm
}: {
  isOpen: boolean
  onClose: () => void
  defaultName: string
  onConfirm: (projectName: string) => void
}) => {
  const { t } = useTranslation()
  const [projectName, setProjectName] = useState(defaultName)

  return (
    <IGRPDialogPrimitive open={isOpen} onOpenChange={onClose}>
      <IGRPDialogContentPrimitive>
        <IGRPDialogHeaderPrimitive>
          <IGRPDialogTitlePrimitive>{t('enterProjectName')}</IGRPDialogTitlePrimitive>
          <IGRPDialogDescriptionPrimitive />
        </IGRPDialogHeaderPrimitive>
        <div className="py-4">
          <IGRPInputPrimitive
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
            placeholder={t('projectNamePlaceholder')}
          />
        </div>
        <IGRPDialogFooterPrimitive>
          <IGRPButtonPrimitive variant="outline" onClick={onClose}>
            {t('cancel')}
          </IGRPButtonPrimitive>
          <IGRPButtonPrimitive
            onClick={() => onConfirm(projectName)}
            disabled={!projectName.trim()}
          >
            {t('confirm')}
          </IGRPButtonPrimitive>
        </IGRPDialogFooterPrimitive>
      </IGRPDialogContentPrimitive>
    </IGRPDialogPrimitive>
  )
}
