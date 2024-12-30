import { AlertDialog, IGRPContainer, IGRPDataTable } from '@igrp/igrp-design-system'
import { ColumnDef } from '@igrp/igrp-design-system/dist/types'
import { IGRPTabs, IGRPTabsContent, IGRPTabsList, IGRPTabsTrigger } from '@renderer/components/tabs'
import { Badge } from '@renderer/components/ui/badge'
import { Button } from '@renderer/components/ui/button'
import { getBadgeColor } from '@renderer/utils/helpers'
import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface PageBuilderProps {
  basePath?: string
  currentItem?: any
  controllers: any
}

export type Endpoint = {
  codigoAcompanhamento: string
}

const ControllerOverview = ({ controllers }: PageBuilderProps) => {
  const { t } = useTranslation()

  const data = controllers[0].content.actions

  const handleDelete = (endpoint: Endpoint) => {console.log(endpoint)}

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'actionName',
      header: 'Action Name'
    },
    {
      accessorKey: 'method',
      header: 'Method Type'
    },
    {
      accessorKey: 'method',
      header: 'Method Type',
      cell: ({ row }) => {
        const method = row.getValue('method') as string
        const color = getBadgeColor(method)
        return <span className={`${color}`}>{method}</span>
      }
    },
    {
      accessorKey: 'path',
      header: 'Path'
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        const endpoint: Endpoint = row.original
        return (
          <div className="flex space-x-2">
            <AlertDialog
              onConfirm={() => handleDelete(endpoint)}
              recordId={endpoint.codigoAcompanhamento}
              title="Você tem absoluta certeza?"
              description={`Tem certeza de que deseja remover este registro ${endpoint.codigoAcompanhamento}?`}
            >
              <Button variant="ghost" size="sm">
                <Trash2 className="h-4 w-4 text-red-500" />
                <span className="sr-only">Excluir</span>
              </Button>
            </AlertDialog>
          </div>
        )
      }
    }
  ]

  return (
    <div className="space-y-4 p-4">
      <IGRPTabs defaultValue="endpoints">
        <IGRPTabsList className="w-full">
          <IGRPTabsTrigger value="endpoints"> {t('Endpoints')}</IGRPTabsTrigger>
          <IGRPTabsTrigger value="documentation"> {t('Documentation')}</IGRPTabsTrigger>
        </IGRPTabsList>
        <IGRPTabsContent value="endpoints">
          <IGRPContainer>
            <IGRPDataTable columns={columns} data={data} />
          </IGRPContainer>
        </IGRPTabsContent>
      </IGRPTabs>
    </div>
  )
}

export default ControllerOverview
