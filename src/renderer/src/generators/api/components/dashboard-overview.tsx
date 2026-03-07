'use client'

import {
    IGRPCardContentPrimitive,
    IGRPCardHeaderPrimitive,
    IGRPCardPrimitive
} from '@igrp/igrp-framework-react-design-system'
import { useTabs } from '@renderer/components/navigation/TabContext'
import { OPTION_TYPE, type OptionType } from '@renderer/constants/appConstants'
import { cn } from '@renderer/lib/utils'
import { Activity, Box, Database, FileText, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface StatsCardProps {
    title: string
    value: number
    Icon: React.ElementType
    description?: string
    iconColor?: string
    buttonGradient?: string
    gradient?: string
    onClick?: () => void
}

interface DashboardOverviewProps {
    stats: {
        modules: number
        controllers: number
        models: number
        dto: number
    }
}

function StatsCard({
    title,
    value,
    Icon,
    iconColor,
    description,
    buttonGradient,
    gradient,
    onClick
}: StatsCardProps): React.ReactNode {
    return (
        <IGRPCardPrimitive className="group relative">
            <div
                className={cn(
                    `absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg`,
                    gradient,
                    'z-0'
                )}
            ></div>
            <IGRPCardHeaderPrimitive>
                <div className="flex items-center justify-between ">
                    <div className="flex items-center">
                        <Icon className={cn(`w-5 h-5 mr-2`, iconColor)} />
                        <h3 className="font-medium">{title}</h3>
                    </div>
                    {onClick && (
                        <button
                            className={cn(
                                `text-primary-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-r p-2.5 rounded-full hover:shadow-lg hover:scale-110 transform`,
                                buttonGradient,
                                'z-10'
                            )}
                            onClick={onClick}
                        >
                            <Plus size={14} />
                        </button>
                    )}
                </div>
            </IGRPCardHeaderPrimitive>
            <IGRPCardContentPrimitive>
                <div className="text-2xl font-bold">{value}</div>
                {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
            </IGRPCardContentPrimitive>
        </IGRPCardPrimitive>
    )
}

export default function DashboardOverview({ stats }: DashboardOverviewProps): React.ReactNode {
    const { t } = useTranslation()

    const { newTab } = useTabs()

    const handleClick = (opt: OptionType): void => {
        newTab({ type: opt })
    }

    const overviewCards = [
        {
            title: t('modules'),
            value: stats.modules,
            Icon: Box,
            description: t('modulesDescription'),
            gradient: 'from-blue-500/20 to-indigo-500/20',
            iconColor: 'text-blue-400',
            buttonGradient: 'from-blue-500 to-indigo-500'
        },
        {
            title: t('endpoints'),
            value: stats.controllers,
            Icon: Activity,
            description: t('endpointsDescription'),
            gradient: 'from-emerald-500/20 to-teal-500/20',
            iconColor: 'text-emerald-400',
            buttonGradient: 'from-emerald-500 to-teal-500',
            onClick: () => handleClick(OPTION_TYPE.ACTION)
        },
        {
            title: t('schemas'),
            value: stats.models,
            Icon: Database,
            description: t('schemasDescription'),
            gradient: 'from-purple-500/20 to-pink-500/20',
            iconColor: 'text-purple-400',
            buttonGradient: 'from-purple-500 to-pink-500',
            onClick: () => handleClick(OPTION_TYPE.MODEL)
        },
        {
            title: t('dtos'),
            value: stats.dto,
            Icon: FileText,
            description: t('dtosDescription'),
            gradient: 'from-amber-500/20 to-orange-500/20',
            iconColor: 'text-amber-400',
            buttonGradient: 'from-amber-500 to-orange-500',
            onClick: () => handleClick(OPTION_TYPE.DATA_OBJECTS)
        }
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {overviewCards.map((card) => (
                <StatsCard key={card.title} {...card} />
            ))}
        </div>
    )
}
