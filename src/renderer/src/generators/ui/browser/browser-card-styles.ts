import { cn } from '@renderer/lib/utils'

/** Theme-aware surface for Permission / Page / BPMN browser cards (shadcn tokens). */
export const BROWSER_CARD_SURFACE =
    'border-border bg-card text-card-foreground shadow-sm transition-all duration-200 hover:border-primary/30 hover:bg-accent/40'

export function browserCardClassName(...extra: Array<string | false | null | undefined>): string {
    return cn(BROWSER_CARD_SURFACE, ...extra)
}

/** Active tab chip — follows theme (Page Manager). */
export const BROWSER_TAB_TRIGGER =
    'rounded-lg border border-transparent px-3 text-muted-foreground hover:text-foreground data-[state=active]:border-border data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-none'

/** Count pill inside a tab trigger (`group` on TabsTrigger). */
export const BROWSER_TAB_BADGE =
    'ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground group-data-[state=active]:border-primary/30 group-data-[state=active]:bg-primary/10 group-data-[state=active]:text-primary'
