import React from 'react'
import {
  IGRPAlertDialogActionPrimitive,
  IGRPAlertDialogCancelPrimitive,
  IGRPAlertDialogPrimitive,
  IGRPAlertDialogTriggerPrimitive,
  IGRPAlertDialogHeaderPrimitive,
  IGRPAlertDialogContentPrimitive,
  IGRPAlertDialogTitlePrimitive,
  IGRPAlertDialogDescriptionPrimitive,
  IGRPAlertDialogFooterPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { Trash } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { IGRPButtonPrimitive } from '@igrp/igrp-framework-react-design-system'

interface DeleteModalProps {
  isOpen: boolean
  onConfirm?: () => void
  onClose: (open: boolean) => void
  recordId?: string
  hasTrigger?: boolean
}

const AlertDialogDelete: React.FC<DeleteModalProps> = ({
  isOpen,
  onConfirm,
  onClose,
  hasTrigger = false,
  recordId
}) => {
  const { t } = useTranslation()
  return (
    <IGRPAlertDialogPrimitive open={isOpen} onOpenChange={onClose}>
      {hasTrigger && (
        <IGRPAlertDialogTriggerPrimitive>
          <IGRPButtonPrimitive
            variant="outline"
            size="sm"
            className="outline  outline-red-500 text-red-500"
          >
            <Trash /> {t('delete')}
          </IGRPButtonPrimitive>
        </IGRPAlertDialogTriggerPrimitive>
      )}
      <IGRPAlertDialogContentPrimitive>
        <IGRPAlertDialogHeaderPrimitive>
          <IGRPAlertDialogTitlePrimitive>{t('areYouAbsolutelySure')}</IGRPAlertDialogTitlePrimitive>
          <IGRPAlertDialogDescriptionPrimitive>
            {t('confirmRemoveRecord')} {recordId ? recordId : ''}?
          </IGRPAlertDialogDescriptionPrimitive>
        </IGRPAlertDialogHeaderPrimitive>
        <IGRPAlertDialogFooterPrimitive>
          <IGRPAlertDialogCancelPrimitive>{t('cancel')}</IGRPAlertDialogCancelPrimitive>
          <IGRPAlertDialogActionPrimitive onClick={onConfirm}>
            {t('continue')}
          </IGRPAlertDialogActionPrimitive>
        </IGRPAlertDialogFooterPrimitive>
      </IGRPAlertDialogContentPrimitive>
    </IGRPAlertDialogPrimitive>
  )
}

export default AlertDialogDelete
