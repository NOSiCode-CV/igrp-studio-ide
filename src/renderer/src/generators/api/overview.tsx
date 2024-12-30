import EmptyPage from './EmptyPage'
import { OptionType } from '@renderer/constants/appConstants'
import { TabItem } from '@renderer/components/TabManager'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@igrp/igrp-design-system'
import DashboardOverview from './components/dashboard-overview'

interface NewProps {
  onOpenNew: (tab: TabItem) => void
  open: OptionType
}

const Overview = ({ onOpenNew }: NewProps): JSX.Element => {
  const { t } = useTranslation()
  const handleOptionClick = (opt: OptionType) => {
    onOpenNew({
      id: `tab-${Date.now()}`,
      title: t(`new${opt.charAt(0).toUpperCase() + opt.slice(1)}`),
      open: opt
    })
  }

  const stats = {
    modules: 12,
    controllers: 24,
    schemas: 18,
    dtos: 36
  }

  return (
    <div className="flex flex-col items-center mt-16 p-4 bg-background">
      <div className="w-full max-w-4xl space-y-8">
        <PageHeader title="API Overview" description="Manage your API endpoints"></PageHeader>
        <DashboardOverview stats={stats} />
        <EmptyPage onClick={handleOptionClick} />
      </div>
    </div>
  )
}

export default Overview
