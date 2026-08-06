# Projects View Redesign — Mission

## Context

Part of the Studio IDE UI redesign (branch `studio-ide-ui-redesign-02`). This spec
covers the redesign of the **Projects view** — the "Resources" tab of the IDE
initial screen — delivered **one part at a time**. Visual targets live in
`docs/studio-ide-ui-redesign-02/`.

> Folder note: this folder was renamed from `projects-header` to `projects-view`
> once the scope grew beyond the header.

### Parts

1. **Header bar** — ✓ complete (incl. sort-menu rework 2026-05-28).
2. **Grid-view project card** — ✓ complete (incl. polish 2026-05-28).
3. **List-view rows** — ✓ complete (incl. polish 2026-05-28).
4. **New Project modal** — ✓ complete (all NP phases + polish 2026-05-28).
5. **Edit Project modal** — ✓ complete (other agent, 2026-05-27; ICON label removed 2026-05-28).
6. **Clone Project modal** — ✓ complete (other agent, 2026-05-27; polish 2026-05-28).
7. **Empty state** — ← current part (not started).

Each part is a **restyle of an existing component** to match an approved scaffold,
reusing the existing state, handlers, and data — not a from-scratch rebuild.

## Goal

Match each scaffold's layout and visual hierarchy, **built from this repository's
own building blocks**:

- the repo's **local components** in `@renderer/components/ui/*` (and existing
  helpers like `ProjectIcon`, `SearchInput`) — the house standard;
- **`lucide-react`** icons imported directly;
- **semantic design tokens** (`primary`, `muted-foreground`, `border`, `card`, …),
  never hardcoded `teal-*` / `slate-*`.

The scaffolds were generated in an AI tool with hardcoded colors and generic
primitives; we keep the *look* but build it from the repo's components. See
`decisions.md` (rules R1–R3) and `tech-stack.md` for the per-part maps.

## Source-of-Truth Rules

- The scaffold image + description define the **visual and behavioral intent**.
- The repository's own components define the **implementation vocabulary**.
- Behavioral fidelity + repo-standard components win over pixel-exactness.
- Evolve the existing components in place; do not fork parallel architecture.

## In Scope — current part (empty state)

Parts 1–6 are complete (see `roadmap.md` for the full per-part status incl. the
2026-05-28 polish pass). The remaining part is **Part 7 — Empty state**: design
and implement the "no projects yet" / "no projects matching <query>" placeholder
for the Resources tab when `filteredProjects.length === 0`.

(See the existing `ProjectEmptyState` in
`src/renderer/src/browser/workspaces/index.tsx` for the current shape — a
dashed-border card with `FolderKanban` + heading + helper text + a "Create new
project" button. The redesign target image is **TBD** — no scaffold has been
shared yet.)

Until the empty-state scaffold is provided, treat all *other* requests against
this folder as **polish / refinement on completed parts**, not new parts.

## Out of Scope

- The 3-dot menu **contents** (the trigger stays; menu is a later part).
- Empty state, and the already-done header + grid card.
- Data-layer changes or project CRUD logic beyond wiring existing handlers.
- Reproducing scaffold quirks/bugs (e.g. the always-"This is…" description) unless
  explicitly chosen — see the grid-card decisions.

## Success Criteria (apply per part)

1. Visually matches the scaffold within the repo components' limits.
2. Built from repo components + `lucide-react` icons + semantic tokens; no
   hardcoded `teal-*` / `slate-*` colors.
3. Existing behaviors preserved (open, actions, deps, ports, updated time).
4. No regressions elsewhere in the Resources tab.

## Non-Goals

- Pixel-perfect `px` cloning where it conflicts with house component sizing.
- Reproducing scaffold quirks unless a recorded decision says so.
