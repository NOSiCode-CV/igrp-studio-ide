import { Workflow } from 'lucide-react'
import type { JSX } from 'react'

interface ProcessDetailsProps {
    processName: string
    projectName?: string
}

export function ProcessDetails({ processName, projectName }: ProcessDetailsProps): JSX.Element {
    return (
        <div className="flex items-start gap-3 border-b bg-gradient-to-b from-muted/40 to-background px-6 py-4">
            <div
                className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                aria-hidden
            >
                <Workflow className="h-5 w-5" />
            </div>
            <div className="min-w-0">
                {projectName && (
                    <div className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        {projectName}
                        <span className="mx-1.5 text-muted-foreground/50">/</span>
                        Process
                    </div>
                )}
                <h1 className="truncate text-lg font-semibold leading-tight">{processName}</h1>
            </div>
        </div>
    )
}
