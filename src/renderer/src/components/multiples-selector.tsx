"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Badge } from "./ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "./ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"

type Option = {
    value: string
    label: string
}

type MultiSelectProps = {
    options: Option[]
    value: string[]
    onChange: (value: string[]) => void
    placeholder?: string
}

export default function MultipleSelector({ options, value, onChange, placeholder = "Select items..." }: MultiSelectProps) {

    const [open, setOpen] = React.useState(false)

    const handleUnselect = (item: string) => {
        onChange(value.filter((i) => i !== item))
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div className="flex min-h-[40px] w-full flex-wrap items-center justify-start rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    {value.length > 0 ? (
                        value.map((item) => (
                            <Badge key={item} variant="secondary" className="mr-1 mb-1">
                                {options.find((option) => option.value === item)?.label}
                                <button
                                    className="ml-1 ring-offset-background rounded-full outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            handleUnselect(item)
                                        }
                                    }}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                    }}
                                    onClick={() => handleUnselect(item)}
                                >
                                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                </button>
                            </Badge>
                        ))
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput placeholder={placeholder} />
                    <CommandEmpty>No item found.</CommandEmpty>
                    <CommandGroup>
                        {options.map((option) => (
                            <CommandItem
                                key={option.value}
                                onSelect={() => {
                                    onChange(
                                        value.includes(option.value)
                                            ? value.filter((item) => item !== option.value)
                                            : [...value, option.value]
                                    )
                                    setOpen(true)
                                }}
                            >
                                <div
                                    className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary ${value.includes(option.value) ? "bg-primary text-primary-foreground" : "opacity-50"
                                        }`}
                                >
                                    {value.includes(option.value) && <X className="h-3 w-3" />}
                                </div>
                                {option.label}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    )
}