import AlertDialogDelete from '@renderer/components/alert-dialog-delete'
import {
  IGRPBreadcrumbItemPrimitive,
  IGRPBreadcrumbLinkPrimitive,
  IGRPBreadcrumbListPrimitive,
  IGRPBreadcrumbPrimitive,
  IGRPButtonPrimitive,
  IGRPSidebarTriggerPrimitive,
  IGRPTooltipContentPrimitive,
  IGRPTooltipProviderPrimitive,
  IGRPTooltipTriggerPrimitive,
  IGRPTooltipPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { IGRPSeparator } from '@igrp/igrp-framework-react-design-system'
import { AppWindowMac, Trash } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface ActionProps {
  title: string
  isNew?: boolean
  onDelete: () => void
  showSourceCode?: () => void
  onClickBreadcrumbLink?: () => void
}

const NavigationBar = ({
  onDelete,
  showSourceCode,
  onClickBreadcrumbLink,
  title,
  isNew
}: ActionProps) => {
  const { t } = useTranslation()

  const [deleteModal, setDeleteModal] = useState<boolean>(false)

  const handleSourceCode = () => {
    showSourceCode?.()
  }

  const handleBreadcrumbLink = () => {
    onClickBreadcrumbLink?.()
  }

  return (
    <IGRPTooltipProviderPrimitive>
      <div className="flex sticky top-0 bg-background h-16 shrink-0 items-center gap-2 border-b px-4 z-50">
        <AlertDialogDelete
          isOpen={deleteModal}
          onClose={() => setDeleteModal(false)}
          onConfirm={onDelete}
          hasTrigger={false}
          recordId={title}
        />

        <IGRPSidebarTriggerPrimitive className="-ml-1" />
        <IGRPSeparator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />

        <IGRPBreadcrumbPrimitive>
          <IGRPBreadcrumbListPrimitive>
            <IGRPBreadcrumbItemPrimitive>
              <IGRPBreadcrumbLinkPrimitive
                onClick={handleBreadcrumbLink}
                className="cursor-pointer"
              >
                <span className="font-semibold">{title}</span>
              </IGRPBreadcrumbLinkPrimitive>
            </IGRPBreadcrumbItemPrimitive>
          </IGRPBreadcrumbListPrimitive>
        </IGRPBreadcrumbPrimitive>

        <div className="ml-auto flex items-center gap-4">
          {!isNew && (
            <>
              <IGRPTooltipPrimitive>
                <IGRPTooltipTriggerPrimitive asChild>
                  <IGRPButtonPrimitive
                    type="button"
                    size="sm"
                    variant={'secondary'}
                    onClick={handleSourceCode}
                  >
                    <AppWindowMac />
                  </IGRPButtonPrimitive>
                </IGRPTooltipTriggerPrimitive>
                <IGRPTooltipContentPrimitive>{t('sourceCode')}</IGRPTooltipContentPrimitive>
              </IGRPTooltipPrimitive>

              <IGRPTooltipPrimitive>
                <IGRPTooltipTriggerPrimitive asChild>
                  <IGRPButtonPrimitive
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault()
                      setDeleteModal(true)
                    }}
                    size={'sm'}
                    className="outline-1 outline-destructive text-destructive"
                  >
                    <Trash />
                    <span className="sr-only">{t('delete')}</span>
                  </IGRPButtonPrimitive>
                </IGRPTooltipTriggerPrimitive>
                <IGRPTooltipContentPrimitive>{t('delete')}</IGRPTooltipContentPrimitive>
              </IGRPTooltipPrimitive>
            </>
          )}
          <IGRPTooltipPrimitive>
            <IGRPTooltipTriggerPrimitive asChild>
              <IGRPButtonPrimitive color="success" type="submit">
                {t('save')}
              </IGRPButtonPrimitive>
            </IGRPTooltipTriggerPrimitive>
            <IGRPTooltipContentPrimitive>{t('save')}</IGRPTooltipContentPrimitive>
          </IGRPTooltipPrimitive>
        </div>
      </div>
    </IGRPTooltipProviderPrimitive>
  )
}

export default NavigationBar
