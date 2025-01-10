import React from "react";
import { SidebarHeader } from "@renderer/components/ui/sidebar";
import FormSearch from "../components/app-search";
import { CreateModuleDialog } from "@renderer/generators/api/components/create-module-dialog";
import { cn } from "@renderer/lib/utils";
import { ConfigOptions } from "src/main/types";

interface AppSidebarHeaderProps {
    config?: ConfigOptions;
    basePath?: string;
    sidebarState: any; // Replace 'any' with the actual type if known
    handleSearch: (value: string) => void;
    className?: string;
}

export const AppSidebarHeader: React.FC<AppSidebarHeaderProps> = ({
    config,
    basePath,
    sidebarState,
    handleSearch,
    className,
}) => {
    return (
        <SidebarHeader className={cn('flex flex-col', className)}>
            <div
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground ml-1 flex flex-1 justify-between"
            >
                <div className="grid flex-1 text-left text-sm leading-tight items-center">
                    <span className="truncate font-semibold">{config?.name}</span>
                    <span className="truncate text-xs">{config?.projectStructureStyle}</span>
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