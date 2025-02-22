'use client';

import { IGRPContainer } from '@igrp/igrp-framework-react-design-system';
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/components/ui/card';
import { Database, FileCode, FileText, Boxes } from 'lucide-react';
import { useTranslation } from 'react-i18next'; // Import useTranslation

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description?: string;
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
  );
}

interface DashboardOverviewProps {
  stats: {
    modules: number;
    controllers: number;
    models: number;
    dto: number;
  };
}

export default function DashboardOverview({ stats }: DashboardOverviewProps) {
  const { t } = useTranslation(); // Hook for translations

  const overviewCards = [
    {
      title: t('modules'),
      value: stats.modules,
      icon: <Boxes className="h-4 w-4 text-muted-foreground" />,
      description: t('modulesDescription'),
    },
    {
      title: t('endpoints'),
      value: stats.controllers,
      icon: <FileCode className="h-4 w-4 text-muted-foreground" />,
      description: t('endpointsDescription'),
    },
    {
      title: t('schemas'),
      value: stats.models,
      icon: <Database className="h-4 w-4 text-muted-foreground" />,
      description: t('schemasDescription'),
    },
    {
      title: t('dtos'),
      value: stats.dto,
      icon: <FileText className="h-4 w-4 text-muted-foreground" />,
      description: t('dtosDescription'),
    },
  ];

  return (
    <IGRPContainer>
      <p>{t('overview')}</p>
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
      </div>
    </IGRPContainer>
  );
}