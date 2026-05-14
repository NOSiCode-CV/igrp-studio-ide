/**
 * Public API — shared IGRP component-name → icon lookup.
 *
 * Anyone holding a `componentName: string` (UI generator palette, Prototype
 * palette, future surfaces) can resolve an icon without depending on
 * `generators/ui/`.
 */

export { ICON_MAP, resolveIcon } from './ICON_MAP'
