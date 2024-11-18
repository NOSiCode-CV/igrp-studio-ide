"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@renderer/lib/utils"
import { Button } from "@renderer/components/ui/button"
import { Calendar, CalendarProps } from "@renderer/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@renderer/components/ui/popover"

type DatePickerProps = {
    name: string
    placeholder?: string
    initialDate?: Date
    dateFormat?: string
    onDateChange?: (date: Date | undefined) => void
    buttonVariant?: string
    buttonClassName?: string
    calendarProps?: Partial<CalendarProps>
    popoverClassName?: string
}

export function DatePicker({
    name,
    placeholder = "Pick a date",
    initialDate,
    dateFormat = "dd-MM-yyyy",
    onDateChange,
    buttonVariant = "outline",
    buttonClassName,
    calendarProps = {},
    popoverClassName,
}: DatePickerProps) {
    const [date, setDate] = React.useState<Date | undefined>(initialDate)

    const handleDateChange = (selectedDate: Date | undefined) => {
        setDate(selectedDate)
        onDateChange?.(selectedDate)
    }

    return (
        <Popover key={name}>
            <PopoverTrigger asChild>
                <Button
                    variant={buttonVariant}
                    className={cn(
                        "justify-start text-left font-normal",
                        !date && "text-muted-foreground",
                        buttonClassName
                    )}
                >
                    <CalendarIcon className="mr-2" />
                    {date ? format(date, dateFormat) : <span>{placeholder}</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className={cn("w-auto p-0", popoverClassName)}>
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDateChange}
                    initialFocus
                    {...calendarProps}
                />
            </PopoverContent>
        </Popover>
    )
}