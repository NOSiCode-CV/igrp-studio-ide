import React from "react";
import { SidebarHeader, SidebarMenuButton } from "@renderer/components/ui/sidebar";
import SpringIcon from '@renderer/assets/images/Spring30x30.svg';
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
            <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground ml-1"
            >
               {/*  <div className="flex aspect-square items-center justify-center">
                    <img src={SpringIcon} className="" />
                </div> */}
                <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{config?.name}</span>
                    <span className="truncate text-xs">{config?.projectStructureStyle}</span>
                </div>
                {basePath && <CreateModuleDialog basePath={basePath} />}
            </SidebarMenuButton>
            <FormSearch
                onSearch={handleSearch}
                className="truncate text-xs"
                placeholder="Search models, data objects..."
                sidebarState={sidebarState}
            />
        </SidebarHeader>
    );
};