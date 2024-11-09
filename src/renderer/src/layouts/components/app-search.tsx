import { Input } from "@renderer/components/ui/input";
import { Label } from "@renderer/components/ui/label";
import { SidebarGroup, SidebarGroupContent, SidebarInput } from "@renderer/components/ui/sidebar";
import { cn } from "@renderer/lib/utils";
import { Search } from "lucide-react";
import { ChangeEvent } from "react";

interface SearchProps {
    className?: string,
    onSearch: (searchTerm: string) => void;
    placeholder?: string | "Search for widget..."
}

const FormSearch = ({ onSearch, className, placeholder }: SearchProps) => {

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        onSearch(e.target.value)
    }

    return (
        <form className="mt-3">
            <SidebarGroup className="py-0">
                <SidebarGroupContent className="relative">
                    <Label htmlFor="search" className="sr-only">
                        Search
                    </Label>
                    <SidebarInput
                        id="search"
                        placeholder={placeholder}
                        onChange={handleInputChange}
                        className={cn('pl-8', className)}
                    />
                    <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 select-none opacity-50" />
                </SidebarGroupContent>
            </SidebarGroup>
        </form>
    )
}
export default FormSearch;