/**
 * Shared types for the Prototype's chat aside.
 *
 * Extracted from `PrototypePanel.tsx` as part of the prototype refactor
 * (P6 — chat chrome + footer).
 */

/**
 * Two-way switch in the left panel header. `chat` mounts the
 * AIAssistant composer; `palette` mounts the engine-component picker.
 * Both are kept mounted (display-toggled) so the AIAssistant's local
 * state survives jumps between modes.
 */
export type ChatPanelMode = 'chat' | 'palette'
