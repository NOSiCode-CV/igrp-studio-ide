import { Loader2 } from 'lucide-react'
import type { JSX } from 'react'

/**
 * One-shot banner shown while the Prototype's first-run `npm install`
 * (or yarn/pnpm) is still hot. Stays put for ~30 seconds while the dev
 * server warms up; live progress lives in the Logs tab.
 *
 * The amber bar at the bottom is a CSS-keyframe shimmer — pure
 * decoration, no state. Defined inline because the rest of the studio
 * has no use for the `firstrun` keyframe; embedding it here keeps the
 * banner self-contained.
 *
 * Extracted from `PrototypePanel.tsx` as part of the prototype refactor
 * (P3 — leaf components / banners).
 */
export const FirstRunBanner = (): JSX.Element => (
    <div className="relative overflow-hidden border-b bg-amber-500/5 px-4 py-2 text-[11px] text-amber-700 dark:text-amber-400">
        <div className="flex items-center gap-2">
            <Loader2 size={12} className="animate-spin" />
            <span className="font-medium">Installing dependencies…</span>
            <span className="text-muted-foreground">
                first-time setup, ~30s. Live progress in the Logs tab.
            </span>
        </div>
        <div className="absolute bottom-0 left-0 h-0.5 w-1/3 animate-[firstrun_1.4s_linear_infinite] bg-amber-500/60" />
        <style>{`@keyframes firstrun{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}`}</style>
    </div>
)
