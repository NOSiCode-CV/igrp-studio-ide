import { LayoutGrid, MessageSquare } from 'lucide-react'
import type { JSX } from 'react'
import { ChatPanelTabButton } from './ChatPanelTabButton'
import type { ChatPanelMode } from './types'

/**
 * Top-of-aside switch between the AI Chat composer and the
 * component Palette.
 *
 * Sits on top of the `bg-sidebar` aside; the row uses the same sidebar
 * token (instead of an opacity-tinted background) so it reads as part
 * of the rail rather than a different surface.
 *
 * Both modes stay mounted at the call site (display-toggled), so the
 * AIAssistant's local state — message history, streaming chunks,
 * composer draft — survives every mode switch.
 *
 * Extracted from `PrototypePanel.tsx` as part of the prototype refactor
 * (P6 — chat chrome + footer).
 */
export const ChatPanelTabs = ({
    mode,
    onChangeMode,
    pinnedCount
}: {
    mode: ChatPanelMode
    onChangeMode: (next: ChatPanelMode) => void
    pinnedCount: number
}): JSX.Element => (
    <div className="flex h-10 shrink-0 items-center gap-1 border-b border-border/80 bg-sidebar px-2">
        <ChatPanelTabButton
            active={mode === 'chat'}
            onClick={() => onChangeMode('chat')}
            icon={<MessageSquare size={13} />}
            label="Chat"
        />
        <ChatPanelTabButton
            active={mode === 'palette'}
            onClick={() => onChangeMode('palette')}
            icon={<LayoutGrid size={13} />}
            label="Palette"
            badge={pinnedCount > 0 ? pinnedCount : undefined}
        />
    </div>
)
