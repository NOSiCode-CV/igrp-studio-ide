# Projects View Redesign — Roadmap & Status

Delivered one part at a time; each part is small and verifiable.

---

## Part 1 — Header bar ✓ COMPLETE

Single-row layout; filter-icon sort; borderless 3-dot; repo-standard components +
lucide + tokens. (Decisions A–H; `isCompact` withdrawn.)

- **Phase 4 — visual polish (2026-05-27):** uppercase count, segmented view toggle,
  divider + compact primary "New project" button, consistent `h-8` sizing. Accent
  stays **token-based / gray** (follows the app theme, not the mockup's teal — the
  app's `--primary` is grayscale). Built on the existing shadcn primitives (no CLI
  overwrite). Mentor confirmed shadcn is the standard (see R1).
- **Phase 5 — sort menu rework (2026-05-28):** items are now **Name / Last
  Modified / Framework** (rendered as plain `DropdownMenuItem`s, not radio items —
  no leading bullet). "Sort by" header dropped. Active item: `bg-emerald-50
  text-emerald-600` + right-aligned `ArrowDownWideNarrow` icon. `4px` item radius.
  Added a `framework` case to the `sortProjects` comparator in `project-grid.tsx`
  (`localeCompare` on `project.framework`).

## Part 2 — Grid-view project card ✓ COMPLETE

Fixed-height card (header / deps / footer); framework `ProjectIcon` chip with
border/shadow; truncated description + port; `HoverCard` dependency expand; footer
updated-time + relocated, always-visible `ProjectActions`; whole-card click to
open; group-hover accents. (Decisions GC1–GC6; polish done; verified.)

- **Polish 2026-05-28** (decisions GC7–GC9):
  - **GC9 — title weight:** `font-bold` → `font-semibold` (was reading too heavy).
  - **GC8 — deps badge ellipsis:** dep text wrapped in an inner `<span class="min-w-0 truncate">` because `text-overflow: ellipsis` doesn't paint on the `Badge`'s `inline-flex` container. Outer Badge keeps `max-w-[140px]`.
  - **GC7 — gated HoverCard expand:** the dep badge now wraps in `HoverCard` only when `dependencyNames.length > 1` **OR** `firstDep.length > 18` (`LONG_DEP_NAME_CHARS` constant at module top of `project-grid.tsx`). Otherwise plain Badge + native `title` tooltip, no hover popover.

---

## Part 3 — List-view rows ✓ COMPLETE

Restyle `ProjectList` (`src/renderer/src/browser/workspaces/projects/project-list.tsx`)
to the scaffold (`docs/studio-ide-ui-redesign-02/project_list_view.png`).

### LV Phase 0 — Lock decisions ✓ (LD1–LD6 signed off 2026-05-27)

- LD1–LD2 resolved, LD3–LD6 confirmed.

### LV Phases 1–3 — ✓ implemented (2026-05-27)

- `ProjectList` rewritten from the `<Table>` into a CSS-grid table (inline
  `gridTemplateColumns` + ARIA roles): uniform `FolderKanban` + name; framework as
  plain text (LD5); port chip; dependency chip (`Database` + first real dep + `+N`,
  LD1); compact `shortenTime` updated value (LD2); hover-revealed 3-dot. Row-click
  preserved (LD4); description dropped (LD6). Gray/token (teal deferred). Pending
  user visual verification.

### LV Phase 4 — polish (2026-05-28) — ✓ (LD7)

- Outer dep chip capped at `max-w-[160px]` + inner text `<span class="min-w-0 truncate">` (mirrors GC8 — the chip is `inline-flex`, ellipsis needs a block-formatted child).
- **LD7** — gated `HoverCard` expand mirroring GC7: only wraps when `dependencyNames.length > 1` **OR** `firstDep.length > 18`. Identical `LONG_DEP_NAME_CHARS = 18` constant at module top of `project-list.tsx`. Single-short-dep rows render a plain chip with `title={firstDep}`.

### LV Phase 1 — Grid "table" shell

- Replace the `<Table>` with a CSS-grid layout: a fixed header row + a rows block
  sharing `grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_80px_36px]`
  with `gap-2`; add ARIA `role="table" / row / columnheader / cell` for a11y.
- Verify: header and row columns line up; long values truncate, not overflow.

### LV Phase 2 — Row content

- Columns: name (`<FolderKanban/>` + truncated name); framework (text); ports chip
  (from service); dependencies chip (LD1); compact updated (LD2); hover-revealed
  3-dot (`ProjectActions`).
- Verify: every column renders; full-row hover tint; ports chip flips on hover.

### LV Phase 3 — Behavior + polish

- Preserve row-click-to-open and the actions menu; focus/hover states.
- Verify: clicking a row opens it; 3-dot menu works; matches the scaffold.

### Definition of done (Part 3)

Mission success criteria 1–4 met for the list.

---

## Part 4 — New Project modal ✓ COMPLETE

Restructure `ProjectWizard` (`src/renderer/src/browser/project/project-form.tsx`)
to the scaffold's 2-step wizard (`newproject1.png`, `newproject2.png`).
Decisions NP1–NP7. All create / validation / icon / dependency logic preserved (NP4).

### NP Phase 0 — decisions ✓ (NP1–NP5, 2026-05-27)

### NP Phase 1 — Shell + sidebar + 2-step nav — ✓ implemented (2026-05-27, pending verify)

- Restructured `DialogContent` into header bar / body (sidebar stages + content) /
  footer. Step state 4→2; validation gates reworked (Step 1 = type + framework;
  Step 2 = name + framework config + path); `STEPS` → 2 entries; validation hook
  now refines `config` on step 2. `Dialog` wired to `open`/`onOpenChange` so Cancel
  closes. `saveOrOpenProject` submit, icon upload, managed-path, framework config
  sub-components all unchanged. Step **content** is the existing fields regrouped
  (not yet scaffold-styled — that's NP Phases 2–3).
- Verify: modal opens/closes; the two stages navigate; **create still works
  end-to-end**.

### NP Phase 2 — Step 1 (Type + Generator) — ✓ implemented (2026-05-27, pending verify)

Fixes identified by comparing the Phase-1 result with `newproject1.png`:

1. **Section labels** — restyle `Project Type` / `Select Framework` to uppercase
   tracked muted tiny (`text-[10px] font-bold uppercase tracking-wider text-muted-foreground`);
   rename the framework section header to **`GENERATOR`**.
2. **Project Type** — replace the stacked-row layout with a **3-column grid**;
   each card is **vertical** (icon top, title, description). Active card =
   `bg-primary/5 border-primary text-primary` (token tint that flips teal later).
3. **Backend icon** — `Server` → **`Database`** (lucide).
4. **Generator (framework picker)** — **2-column grid** of framework cards
   (`FrameworkIcon` chip + bold title + small description); inline **search
   input** on the right of the `GENERATOR` label that filters frameworks by
   name/description; small uppercase **`SOON`** pill badge for unsupported
   frameworks (replacing the plain "Coming soon" text); active card tint matches #2.
- Verify: section labels styled; type cards 3-up; backend uses `Database`; framework
  generator grid + search filter; `SOON` pill on Vue/Angular/.NET/Django/Go;
  selecting type filters frameworks; selection still drives step-1 validity.

### NP Phase 3 — Step 2 (Details + config) — ✓ implemented (2026-05-27)

- Three framework-specific Step 2 renderers added inside `ProjectWizard`:
  - **`renderNextJsStep2`** — PROJECT DETAILS (icon uploader + name + description
    `Input` + location radios + path/folder button) + FRONTEND CONFIGURATION (App
    Name auto-slug + Theme Color swatch). Git checkbox skipped (NP2).
  - **`renderSpringBootStep2`** — same PROJECT DETAILS + BACKEND CONFIGURATION:
    paired Group / Artifact inputs, paired DB Engine / Structure Style selects,
    three Features toggle pills (Observability / Entity Revision / Graal VM),
    Dependencies subsection with upward dropdown + chips. Auto-defaults:
    `group='cv.igrp'`, `database='Postgresql'`, `projectStructureStyle='technical'`.
  - **`renderSpecificationStep2`** — same PROJECT DETAILS + AI SPECIFICATION
    SETTINGS: App Name + Default LLM select + Embeddings select. Module-level
    curated `llmModels` / `embeddingsModels` arrays seed defaults.
- Verified: name auto-slug, managed path, icon upload, deps, theme color all work.

### NP Phase 4 — Polish (2026-05-28) — ✓ (NP6 / NP7)

- **NP6** — dropped `font-mono` on Group + Artifact inputs (Inter for everything
  in the modal, consistent typography across labels and fields).
- **NP7** — DB Engine + Structure Style: native `<select>` → shadcn `Select`. The
  closed field looks identical (`h-7 text-[11px] rounded-sm`); the popover is the
  upgrade (rounded, bordered, themed item hover, `Check` indicator on the active
  option, keyboard nav).
- **Search generators input** — `rounded-[4px]` + `border-[0.5px] border-muted-foreground/20` + `shadow-none` for a visually lighter border (per-instance className override; primitive untouched per R5).
- **Biome a11y cleanup** — `htmlFor` on every `<label>` wrapping a `RadioGroupItem`; NextJS storage radios namespaced (`-next` suffix); Spring dep dropdown rows converted to `<button type="button">` (nested redundant `+` button → `<span>`); `useEffect`s for Spring/Spec config defaults got documented `// biome-ignore lint/correctness/useExhaustiveDependencies` (single-line) explaining the setValue-feedback-loop rationale; dep map keys dropped `${i}` (Maven coords are unique).

## Part 5 — Edit Project modal ✓ COMPLETE (other agent, 2026-05-27)

`src/renderer/src/browser/workspaces/projects/edit-project-modal.tsx` rewritten:

- Migrated from shadcn `Dialog` to a custom `createPortal` overlay (`z-[10000]`) +
  `motion`/`AnimatePresence` for entrance/exit animations.
- 48×48 dashed icon uploader (FolderKanban ↔ Plus on hover) over a hidden
  `<input type="file">`.
- Theme Color swatch bar with luminance-based auto-contrast for text + Palette
  icon, over a hidden `<input type="color">`.
- Two-column form layout (11px body / 10px helper typography).
- **Preserved:** `react-hook-form` + Zod validation + `updateProject` mutation.

**Polish (2026-05-28):** removed the small "ICON" `<span>` label above the upload
button. The flex column / gap / padding around the upload button are unchanged.

## Part 6 — Clone Project modal ✓ COMPLETE (other agent, 2026-05-27)

`src/renderer/src/components/git/clone-project-modal.tsx` rewritten:

- Migrated from shadcn `Dialog` to `createPortal` + `motion`/`AnimatePresence`
  with animated tab switching.
- Custom segmented tabs: **Repository URL** / **Search Repositories**.
- URL tab: segmented Auth Type (None / Basic / Token) with animated reveals and
  Eye/EyeOff password toggles.
- Search tab: filter dropdown (All / GitHub / GitLab), active filter pills,
  custom interactive repository list (animated selection indicator via
  `layoutId="active-bar"`, conditional clone-status styling, platform-specific
  badges).
- Replaced mock repo data with real `useGitAuth` / `useGit` hooks.
- **Preserved:** `handleCloneProject` IPC + `saveOrOpenProject` callback.
- **Bug fix:** removed a leaking global `<style>` block (a `button:last-child`
  selector) that was breaking app-wide styling. Enforces new rule: dynamic
  styling via Tailwind `className` interpolation, never injected `<style>` blocks.

**Polish (2026-05-28):**

- **Filter dropdown** — width `w-36` → `w-32`; added `space-y-1` between items.
- **Eye/EyeOff convention flipped** on BOTH the Basic password and Token fields:
  icon now represents the **current state**, not the click action — visible
  (`type="text"`) → `Eye` (open), masked (`type="password"`) → `EyeOff` (slashed).
  Animation keys swapped (`'show'` ↔ `'hide'`) to match.
- **Mock repositories (TEMP).** OAuth redirect URIs are invalid in this dev env,
  so a six-entry `MockRepo[]` fallback was added inside the modal file (mix of
  GitHub/GitLab × public/private × null-desc × long name × with/without
  `stargazers_count`). Triggers when `repositoriesGitHub.length +
  repositoriesGitLab.length === 0`. Also: `clonedRepos` initial state seeded
  with `[90001]` (the first mock's id) so the dark "Open Project" footer variant
  is visible; the `get-cloned-repos` IPC effect changed from `setClonedRepos(cloned)`
  to a merge (`prev → Set(prev + cloned)`) so the seed survives. **All TEMP
  blocks are `// TEMP:`-tagged and listed in `todo.md` for removal once OAuth
  works locally.**

## Part 7 — Empty state

Later, as a separate part.
