"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from 'lucide-react'
import { DateRange } from "react-day-picker"

import { cn } from "@renderer/lib/utils"
import { Button } from "@renderer/components/ui/button"
import { Calendar } from "@renderer/components/ui/calendar"
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
  buttonClassName?: string
  calendarProps?: Omit<React.ComponentProps<typeof Calendar>, 'mode' | 'selected' | 'onSelect'>
  popoverClassName?: string
}

export function DatePicker({
  placeholder = "Pick a date",
  initialDate,
  dateFormat = "dd-MM-yyyy",
  buttonClassName,
  popoverClassName,
}: DatePickerProps) {
  const [date, _setDate] = React.useState<DateRange | undefined>(
    initialDate ? { from: initialDate, to: initialDate } : undefined
  )

  /* const _handleDateChange = (selectedDate: DateRange | undefined) => {
    setDate(selectedDate)
    onDateChange?.(selectedDate?.from)
  } */

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[240px] justify-start text-left font-normal",
            !date && "text-muted-foreground",
            buttonClassName
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date?.from ? (
            format(date.from, dateFormat)
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-auto p-0", popoverClassName)} align="start">
      {/*   <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateChange}
          initialFocus
          {...calendarProps}
        /> */}
      </PopoverContent>
    </Popover>
  )
}