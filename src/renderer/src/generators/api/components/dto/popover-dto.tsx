
import { Button } from "@renderer/components/ui/button"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@renderer/components/ui/popover"
import { ReactNode } from "react"

interface PopoverDtoProps {
	children: ReactNode
}

export function PopoverDto({ children }: PopoverDtoProps) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="link">Advanced</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80" align="end" side="bottom">
				<div className="grid gap-4">
					<div className="space-y-2">
						<h4 className="font-medium leading-none">Validations</h4>
						<p className="text-sm text-muted-foreground">
							Set the validations for the data objects.
						</p>
						<div className="grid gap-2">
							{children}
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	)
}
