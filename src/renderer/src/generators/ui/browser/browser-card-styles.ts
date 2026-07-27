import { cn } from '@renderer/lib/utils'

/** Dark surface used by Permission / Page / BPMN browser cards. */
export const BROWSER_CARD_SURFACE =
    'border-slate-800/80 bg-[#121824] text-slate-100 shadow-sm transition-all duration-200 hover:border-slate-700 hover:bg-[#161f30]'

export function browserCardClassName(...extra: Array<string | false | null | undefined>): string {
    return cn(BROWSER_CARD_SURFACE, ...extra)
}

/** Active tab chip — dark surface + emerald accent (Page Manager). */
export const BROWSER_TAB_TRIGGER =
    'rounded-lg border border-transparent px-3 text-slate-400 hover:text-slate-200 data-[state=active]:border-slate-700/80 data-[state=active]:bg-[#1e2632] data-[state=active]:text-emerald-400 data-[state=active]:shadow-none dark:data-[state=active]:border-slate-700/80 dark:data-[state=active]:bg-[#1e2632] dark:data-[state=active]:text-emerald-400'

/** Count pill inside a tab trigger (`group` on TabsTrigger). */
export const BROWSER_TAB_BADGE =
    'ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-slate-700 bg-slate-800/60 px-1.5 font-mono text-[10px] text-slate-400 group-data-[state=active]:border-emerald-500/20 group-data-[state=active]:bg-emerald-500/10 group-data-[state=active]:text-emerald-400/90'
