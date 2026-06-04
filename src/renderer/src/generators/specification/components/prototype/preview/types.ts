/**
 * Shared types for the Prototype's Preview tab.
 *
 * Lives in its own file so PreviewToolbar / PreviewPane / PrototypePanel
 * can import the same definitions without circular references.
 *
 * Extracted from `PrototypePanel.tsx` as part of the prototype refactor
 * (P4 — preview chrome).
 */

/**
 * Preview tab has two interaction modes — runtime preview (next dev
 * served inside the webview) and the edit canvas (low-fi wireframe of
 * the manifest tree, mutated locally and re-applied via
 * `engine.createPage`). The toggle lives in the PreviewToolbar so both
 * modes share the same surface.
 */
export type PreviewMode = 'live' | 'edit'

/**
 * Device frame for the runtime preview viewport. `custom` exposes a
 * width input so the user can dial in any pixel value between
 * `MIN_CUSTOM_VIEWPORT` and `MAX_CUSTOM_VIEWPORT`.
 */
export type DeviceFrame = 'desktop' | 'tablet' | 'mobile' | 'custom'
