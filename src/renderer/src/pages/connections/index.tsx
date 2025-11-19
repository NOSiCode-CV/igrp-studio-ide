import { ContainerScrollArea } from '@renderer/generators/api/components/ContainerScrollArea'
import { ConnectionManager } from '@renderer/generators/api/components/DatabaseManager/ConnectionManager'
import { useTranslation } from 'react-i18next'

export default function Connections() {
  const { t } = useTranslation()
  return (
    <ContainerScrollArea>
      <div className="w-full mx-auto space-y-8 p-6">
        <ConnectionManager title={t('manageConnections')}></ConnectionManager>
      </div>
    </ContainerScrollArea>
  )
}
