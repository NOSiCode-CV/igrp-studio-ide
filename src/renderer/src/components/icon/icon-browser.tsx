import { Button } from '@renderer/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/components/ui/popover'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from '@renderer/components/ui/tooltip'
import { IGRPInputSearch } from '@igrp/igrp-framework-react-design-system'
import { getLabel } from '@renderer/utils'
import { icons } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDebounce } from 'use-debounce'

interface IconBrowserProps {
    selectedIcon: string
    onSelectedIcon: (icon: string) => void
}

const IconBrowserNew = ({ selectedIcon, onSelectedIcon }: IconBrowserProps) => {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [debouncedSearch] = useDebounce(search, 200)

    const iconsList = useMemo(() => Object.keys(icons) as (keyof typeof icons)[], [])

    const filteredIcons = useMemo(() => {
        if (!debouncedSearch) return iconsList
        return iconsList.filter((name) =>
            name.toLowerCase().includes(debouncedSearch.toLowerCase())
        )
    }, [iconsList, debouncedSearch])

    const handleIconClick = (iconName: string) => {
        onSelectedIcon(iconName)
        setOpen(false)
    }

    const SelectedIconComp = icons[selectedIcon as keyof typeof icons]

    return (
        <TooltipProvider>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button size={'sm'} variant={'outline'}>
                        {SelectedIconComp && <SelectedIconComp />}
                        {selectedIcon || 'Select Icon'}
                    </Button>
                </PopoverTrigger>

                <PopoverContent className="w-[435px] z-[60]">
                    <IGRPInputSearch
                        placeholder="Type to search icon ..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value)
                        }}
                    />
                    <div className="max-h-[300px] overflow-y-auto">
                        <div className="grid grid-cols-8 gap-2 p-2">
                            {filteredIcons.map((iconName, index) => {
                                const IconComponent = icons[iconName]
                                return (
                                    <div
                                        key={index}
                                        className="p-2 flex items-center justify-center cursor-pointer hover:bg-gray-100 rounded"
                                    >
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <IconComponent
                                                    onClick={() => handleIconClick(iconName)}
                                                    className="w-5 h-5"
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent>{getLabel(iconName)}</TooltipContent>
                                        </Tooltip>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        </TooltipProvider>
    )
}

export default IconBrowserNew
