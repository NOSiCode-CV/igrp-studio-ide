/**
 * Curated palette of shadcn-flavoured Next.js components the user can pin
 * as design intent for an AI generation turn.
 *
 * Deliberately a small static list (not the engine's `ComponentRegisterConfig`
 * registry) — that one is tuned for the visual page builder, not free-form
 * Next.js prototype gen. Items here sit at the granularity the LLM benefits
 * from: high-signal building blocks, not every primitive.
 *
 * Lives under `features/` so any generator (Specification Prototype today,
 * future generators tomorrow) can reuse the same vocabulary.
 */

export type PaletteCategory = 'Layout' | 'Data' | 'Forms' | 'Feedback' | 'Navigation'

export interface PaletteComponent {
    id: string
    name: string
    category: PaletteCategory
    /** Short hint injected into the system prompt to steer codegen. */
    hint: string
}

export const PALETTE: PaletteComponent[] = [
    {
        id: 'card',
        name: 'Card',
        category: 'Layout',
        hint: 'shadcn `Card` with header, content, footer'
    },
    {
        id: 'sidebar',
        name: 'Sidebar',
        category: 'Layout',
        hint: 'shadcn collapsible sidebar with nav links'
    },
    {
        id: 'tabs',
        name: 'Tabs',
        category: 'Layout',
        hint: 'shadcn `Tabs` for grouping related views'
    },
    {
        id: 'sheet',
        name: 'Sheet',
        category: 'Layout',
        hint: 'shadcn slide-over panel for secondary actions'
    },
    {
        id: 'table',
        name: 'Table',
        category: 'Data',
        hint: 'shadcn `Table` with headers, rows, mock data layer'
    },
    {
        id: 'data-table',
        name: 'DataTable',
        category: 'Data',
        hint: 'shadcn `DataTable` with sort + pagination on TanStack Table'
    },
    {
        id: 'chart',
        name: 'Chart',
        category: 'Data',
        hint: 'recharts `LineChart`/`BarChart` driven by mock data'
    },
    {
        id: 'list',
        name: 'List',
        category: 'Data',
        hint: 'simple list with avatar + primary/secondary text rows'
    },
    {
        id: 'form',
        name: 'Form',
        category: 'Forms',
        hint: 'react-hook-form + zod validation, shadcn fields'
    },
    {
        id: 'input',
        name: 'Input',
        category: 'Forms',
        hint: 'shadcn `Input` with label and helper text'
    },
    {
        id: 'select',
        name: 'Select',
        category: 'Forms',
        hint: 'shadcn `Select` with grouped options'
    },
    {
        id: 'combobox',
        name: 'Combobox',
        category: 'Forms',
        hint: 'shadcn `Combobox` (search + select)'
    },
    {
        id: 'date-picker',
        name: 'DatePicker',
        category: 'Forms',
        hint: 'shadcn `Calendar` + `Popover` date picker'
    },
    {
        id: 'dialog',
        name: 'Dialog',
        category: 'Feedback',
        hint: 'shadcn `Dialog` modal with title, description, actions'
    },
    {
        id: 'alert-dialog',
        name: 'AlertDialog',
        category: 'Feedback',
        hint: 'shadcn `AlertDialog` for destructive confirmations'
    },
    {
        id: 'toast',
        name: 'Toast',
        category: 'Feedback',
        hint: 'shadcn `useToast` hook with non-blocking notifications'
    },
    {
        id: 'skeleton',
        name: 'Skeleton',
        category: 'Feedback',
        hint: 'shadcn `Skeleton` placeholders during loading'
    },
    {
        id: 'breadcrumb',
        name: 'Breadcrumb',
        category: 'Navigation',
        hint: 'shadcn `Breadcrumb` for hierarchical pages'
    },
    {
        id: 'pagination',
        name: 'Pagination',
        category: 'Navigation',
        hint: 'shadcn `Pagination` with prev/next + page numbers'
    },
    {
        id: 'command',
        name: 'Command',
        category: 'Navigation',
        hint: 'shadcn `Command` palette (Cmd+K) with searchable actions'
    }
]

export const PALETTE_BY_ID = new Map(PALETTE.map((c) => [c.id, c]))
