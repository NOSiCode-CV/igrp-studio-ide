import { SidebarHeader } from '@renderer/components/ui/sidebar'
import { CreateModuleDialog } from '@renderer/generators/api/components/create-module-dialog'
import { cn } from '@renderer/lib/utils'
import type React from 'react'
import { useTranslation } from 'react-i18next'
import FormSearch from '../components/app-search'

interface AppSidebarHeaderProps {
    basePath: string
    name?: string
    description?: string
    sidebarState: any
    handleSearch: (value: string) => void
    className?: string
}

export const AppSidebarHeader: React.FC<AppSidebarHeaderProps> = ({
    basePath,
    description,
    sidebarState,
    handleSearch,
    className
}) => {
    const { t } = useTranslation()
    return (
        <SidebarHeader className={cn('flex flex-col', className)}>
            <div className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground ml-1 pr-3 flex flex-1 justify-between items-center">
                <span className="font-semibold">{description}</span>
                {basePath && <CreateModuleDialog basePath={basePath} />}
            </div>
            <FormSearch
                onSearch={handleSearch}
                className="truncate text-xs"
                placeholder={`${t('search')} ${description}`}
                sidebarState={sidebarState}
            />
        </SidebarHeader>
    )
}
