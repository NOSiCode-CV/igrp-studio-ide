import React from 'react';
import { SidebarHeader } from '@renderer/components/ui/sidebar';
import FormSearch from '../components/app-search';
import { CreateModuleDialog } from '@renderer/generators/api/components/create-module-dialog';
import { cn } from '@renderer/lib/utils';

interface AppSidebarHeaderProps {
    basePath: string;
    name?: string;
    description?: string;
    sidebarState: any;
    handleSearch: (value: string) => void;
    className?: string;
}

export const AppSidebarHeader: React.FC<AppSidebarHeaderProps> = ({
    basePath,
    name,
    description,
    sidebarState,
    handleSearch,
    className,
}) => {
    return (
        <SidebarHeader className={cn('flex flex-col', className)}>
            <div className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground ml-1 flex flex-1 justify-between">
                <div className="grid flex-1 text-left text-sm leading-tight items-center">
                    <span className="truncate font-semibold">{name}</span>
                    <span className="truncate text-xs">{description}</span>
                </div>
                {basePath && <CreateModuleDialog basePath={basePath} />}
            </div>
            <FormSearch
                onSearch={handleSearch}
                className="truncate text-xs"
                placeholder="Search schemas, data objects..."
                sidebarState={sidebarState}
            />
        </SidebarHeader>
    );
};
