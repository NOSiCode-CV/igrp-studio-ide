'use client'

import { IGRPContainer } from '@igrp/igrp-design-system'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Database, FileCode, FileText, Boxes } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: number
  icon: React.ReactNode
  description?: string
}

function StatsCard({ title, value, icon, description }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  )
}

interface DashboardOverviewProps {
  stats: {
    modules: number
    controllers: number
    schemas: number
    dtos: number
  }
}

export default function DashboardOverview({ stats }: DashboardOverviewProps) {
  const overviewCards = [
    {
      title: 'Modules',
      value: stats.modules,
      icon: <Boxes className="h-4 w-4 text-muted-foreground" />,
      description: 'Total application modules'
    },
    {
      title: 'Endpoints',
      value: stats.controllers,
      icon: <FileCode className="h-4 w-4 text-muted-foreground" />,
      description: 'API endpoints controllers'
    },
    {
      title: 'Schemas',
      value: stats.schemas,
      icon: <Database className="h-4 w-4 text-muted-foreground" />,
      description: 'Data models and schemas'
    },
    {
      title: 'DTOs',
      value: stats.dtos,
      icon: <FileText className="h-4 w-4 text-muted-foreground" />,
      description: 'Data transfer objects'
    }
  ]

  return (
    <IGRPContainer>
      <p>Overview</p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {overviewCards.map((card) => (
          <StatsCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            description={card.description}
          />
        ))}
      </div>{' '}
    </IGRPContainer>
  )
}
