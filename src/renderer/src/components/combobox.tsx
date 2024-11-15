"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@renderer/lib/utils"
import { Button } from "./ui/button"
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "./ui/command"

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "./ui/popover"

type Option = {
	value: string
	label: string
}

type ComboboxProps = {
	name: string,
	options: Option[]
	value?: string
	onChange: (selected: string) => void
	placeholder?: string
	className?: string
}

export function Combobox({ options, value, onChange, placeholder = "Select items...", className }: ComboboxProps) {
	const [open, setOpen] = React.useState(false)

	const handleSelect = (currentValue: string) => {
		onChange(currentValue === value ? "" : currentValue)
		setOpen(false)
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-[200px] justify-between"
				>
					{value
						? options.find((opt) => opt.value === value)?.label
						: placeholder}
					<ChevronsUpDown className="opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className={cn("w-[200px] p-0", className)}>
				<Command>
					<CommandInput placeholder={placeholder} className="h-9" />
					<CommandList>
						<CommandEmpty>No Item found.</CommandEmpty>
						<CommandGroup>
							{options.map((opt, idx) => (
								<CommandItem
									key={`${opt.value}-${idx}`}
									value={opt.value}
									onSelect={(currentValue) => handleSelect(currentValue)}
								>
									{opt.label}
									<Check
										className={cn(
											"ml-auto",
											value === opt.value ? "opacity-100" : "opacity-0"
										)}
									/>
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	)
}
