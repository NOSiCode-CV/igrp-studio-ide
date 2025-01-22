import AlertDialogDelete from '@renderer/components/alert-dialog-delete'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList
} from '@renderer/components/ui/breadcrumb'
import { Button } from '@renderer/components/ui/button'
import { Separator } from '@renderer/components/ui/separator'
import { SidebarTrigger } from '@renderer/components/ui/sidebar'
import { Trash } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface ActionProps {
  onDelete: () => void
  onSubmit: () => void
  title: string
  isNew?: boolean
}

const NavigationBar = ({ onSubmit, onDelete, title, isNew }: ActionProps) => {
  const { t } = useTranslation()

  const [deleteModal, setDeleteModal] = useState<boolean>(false)

  return (
    <div className="flex sticky top-0 bg-background h-16 shrink-0 items-center gap-2 border-b px-4 z-50">
      <AlertDialogDelete
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={onDelete}
        hasTrigger={false}
        recordId={title}
      />

      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">
              <span className="font-semibold "> {title && t(title)}</span>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-4">
        {!isNew && (
          <Button
            variant="outline"
            onClick={() => setDeleteModal(true)}
            size={'sm'}
            className="outline outline-1 outline-red-500 text-red-500"
          >
            <Trash /> {t('delete')}
          </Button>
        )}
        
        <Button color="success" onClick={onSubmit} type="submit">
          {t('save')}
        </Button>
      </div>
    </div>
  )
}

export default NavigationBar
