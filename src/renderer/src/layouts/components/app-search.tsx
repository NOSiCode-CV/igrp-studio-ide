import { IGRPButtonPrimitive } from "@igrp/igrp-framework-react-design-system";
import { Label } from "@renderer/components/ui/label";
import { SidebarGroup, SidebarGroupContent, SidebarInput } from "@renderer/components/ui/sidebar";
import { cn } from "@renderer/lib/utils";
import { Search } from "lucide-react";
import { ChangeEvent } from "react";
import { useTranslation } from 'react-i18next';

interface SearchProps {
    className?: string,
    onSearch: (searchTerm: string) => void;
    placeholder?: string | "Search for widget...",
    sidebarState?: string
}

const FormSearch = ({ onSearch, sidebarState, className, placeholder }: SearchProps) => {
    const { t } = useTranslation();
    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        onSearch(e.target.value)
    }

    return (
        <div className="mt-2">
            {sidebarState === 'expanded' ? (
                <SidebarGroup className="py-0">
                    <SidebarGroupContent className="relative">
                        <Label htmlFor="search" className="sr-only">
                            {t('search')}
                        </Label>
                        <SidebarInput
                            id="search"
                            placeholder={placeholder}
                            onChange={handleInputChange}
                            className={cn('pl-8', className)}
                        />
                        <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 select-none opacity-50" />
                    </SidebarGroupContent>
                </SidebarGroup>) : (
                <IGRPButtonPrimitive
                    variant="ghost"
                    size="icon"
                    className="w-full"
                    onClick={() => {/* Implement sidebar expand action */ }}
                    aria-label="Expand sidebar to search"
                >
                    <Search className="h-4 w-4" />
                </IGRPButtonPrimitive>
            )}
        </div>
    )
}
export default FormSearch;