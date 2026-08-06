/**
 * Curated list of "structural" engine component names always included in
 * the Prototype's system prompt — containers, common form fields,
 * typography atoms — regardless of which components the user has pinned
 * in the palette.
 *
 * Rationale: the full engine catalog has ~100 components, each with
 * dozens of properties. Inlining all of them in every chat turn would
 * blow the prompt budget. This curated set covers the components the
 * LLM needs to produce a coherent skeleton, with the user's pinned
 * picks layered on top for the turn-specific vocabulary.
 *
 * Extracted from `PrototypePanel.tsx` (M6.1) as part of the prototype
 * refactor (P1).
 */
export const ALWAYS_INCLUDED_COMPONENTS: ReadonlyArray<string> = [
    // Structure
    'section',
    'container',
    'grid',
    'flex',
    'columns',
    // Layout / display
    'card',
    'panel',
    'tabs',
    'accordion',
    'separator',
    // Typography / atoms
    'pageHeader',
    'headline',
    'paragraph',
    'text',
    'span',
    'badge',
    // Forms
    'form',
    'input',
    'inputText',
    'inputNumber',
    'inputDatePicker',
    'inputPassword',
    'inputTextarea',
    'select',
    'combobox',
    'checkbox',
    'radio',
    'switch',
    'button',
    // Data display
    'table',
    'list',
    'infoCard',
    // Feedback / nav
    'alert',
    'modalDialog',
    'menuNavigation',
    'breadcrumb'
] as const
