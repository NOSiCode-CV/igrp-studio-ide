# UI Redesign — Follow-ups post merge (`feat/studio-ide-ui`)

Status: registered 2026-05-23, after merging the 3 sub-branches into
`feat/studio-ide-ui`:

- `feat/studio-ide-ui-redesign-01` — services + navigation + docker
- `feat/studio-ide-ui-redesign-03` — workspace settings panel
- `feat/studio-ide-ui-redesign-02` — projects view UI

Below is the punch-list of things that need a second pass before this
branch is shipped. Items are ordered by what's actively broken first
(bugs), then UX polish, then theme correctness.

---

## 🐛 Bugs

### #1 — "Create project" doesn't work

**Severity:** blocker
**Symptom:** the "New project" flow no longer creates a project after the
merge (or the action doesn't trigger / errors silently).

**Probable owners:**
- `src/renderer/src/browser/project/project-form.tsx` (touched by 02)
- `src/renderer/src/browser/project/data.ts` (touched by 02)
- `src/renderer/src/browser/project/validation.ts` (touched by 02)

**Acceptance criteria:**
- Click "New project" → form opens → fill basics → submit → project lands
  on disk, appears in the workspace's projects grid.
- Errors during create surface inline (not via `window.alert`).

---

### #2 — "Clone git" modal — projects list inside has scroll issue

**Severity:** UX bug
**Symptom:** when cloning a git repo, the modal listing existing /
matching projects doesn't scroll past the visible viewport (content
overflow clipped).

**Probable owner:**
- `src/renderer/src/components/git/clone-project-modal.tsx`

**Acceptance criteria:**
- Modal has a max height with `overflow-y-auto` on the inner scroll area
  (use `ScrollArea` from `@renderer/components/ui/scroll-area`).
- Tested with 20+ matching projects — scroll works smoothly, no nested
  scroll bug.

---

### #3 — Scroll inside Services view

**Severity:** UX bug
**Symptom:** the services list / grid doesn't scroll correctly when it
exceeds the viewport. Either no scroll, or wrong scroll container (scroll
moves the whole page instead of the list).

**Probable owners:**
- `src/renderer/src/browser/workspaces/services/index.tsx`
- `src/renderer/src/browser/workspaces/services/service-grid.tsx`
- `src/renderer/src/browser/workspaces/services/service-list.tsx`

**Acceptance criteria:**
- Services view fills available height, scroll happens **inside** the
  list, not on the whole page.
- Filter bar + actions stay sticky at the top of the services pane.

---

## 🎨 Theme & colors

### #4 — Eliminate hardcoded colors; primary must come from theme tokens

**Severity:** high (affects dark mode + future re-theming)
**Symptom:** the merged branches kept hardcoded `bg-teal-*`,
`text-teal-*`, `bg-slate-*`, `bg-white`, `border-slate-*` in several
places. These break in dark mode and don't track future theme changes.

**Audit targets** (grep `bg-teal\|text-teal\|bg-slate-[0-9]\|bg-white\b`):
- `src/renderer/src/browser/workspaces/workspace-services.tsx` (3 hits at
  least — `bg-white`)
- `src/renderer/src/browser/workspaces/views/workspace-diagram.tsx`
  (hardcoded `#10b981`, `#6b7280`, `bg-white dark:bg-gray-800`)
- `src/renderer/src/generators/ui/renderers/tools/*Tools.tsx`
  (`hover:bg-white hover:text-black`)
- `src/renderer/src/generators/ui/utils/layout-mapping.ts`
  (preset class names using `bg-white`)

**Acceptance criteria:**
- All "primary" surfaces use `bg-primary` / `text-primary` /
  `text-primary-foreground` / `border-primary`.
- All cards / panels use `bg-card` / `bg-background` / `bg-muted`.
- All destructive uses `bg-destructive` / `text-destructive`.
- Greyscale text uses `text-foreground` / `text-muted-foreground`.
- Zero `bg-white`, `bg-slate-N`, `bg-teal-N`, `bg-gray-N`, `bg-zinc-N`,
  `text-black`, hex values (`#xxxxxx`) in `src/renderer/src/`.
- Validation: `grep -rE 'bg-(white|slate|teal|gray|zinc|neutral|stone)-[0-9]+|#[0-9a-f]{3,6}' src/renderer/src/` returns nothing meaningful.

---

## 📏 Sizing & layout

### #5 — Component sizes too small — inspire on IntelliJ density

**Severity:** medium (perceived polish)
**Symptom:** buttons, header heights, fonts, paddings across the
redesigned views read as cramped compared to IntelliJ IDEA's IDE chrome
(which is the reference the team wants to match).

**Probable surfaces:**
- Workspace browser cards (height, padding)
- Services list rows
- Settings panel rows
- Modal triggers (buttons in header)

**Acceptance criteria:**
- Pick a reference IntelliJ screen and a corresponding Studio screen,
  put side-by-side, match: line heights, font sizes, button heights,
  padding inside panels.
- The whole workspace browser should look "comfortably dense" — not
  cramped, not airy.

---

### #6 — Modals too small

**Severity:** medium
**Symptom:** dialogs / modals (Create Project, Settings sub-dialogs,
Clone Git) feel cramped. Content gets clipped or requires scrolling that
shouldn't be needed.

**Probable owners:**
- `src/renderer/src/components/ui/dialog.tsx` (default max-width)
- Individual modal components passing their own width

**Acceptance criteria:**
- Default modal width bumped (e.g. `max-w-2xl` → `max-w-3xl` for content
  modals; `max-w-md` → `max-w-lg` for confirmation modals).
- Specific modals (Project Form, Clone Git, Settings) override to match
  their content (≥ `max-w-3xl` where it makes sense).
- Test on 1280px viewport — no content clipping, no scroll-inside-modal
  unless the content is genuinely long (e.g. settings categories).

---

### #7 — Project name font-weight too aggressive

**Severity:** low (typography polish)
**Symptom:** the merged `project-grid.tsx` / `project-list.tsx` uses
`font-semibold` or stronger on project names. Combined with the colour
shift on hover, it reads as too visually heavy compared to the
surrounding text.

**Probable owners:**
- `src/renderer/src/browser/workspaces/projects/project-grid.tsx`
- `src/renderer/src/browser/workspaces/projects/project-list.tsx`

**Acceptance criteria:**
- Project name uses `font-medium` (or even `font-normal` with
  `tracking-tight`) — keep the hover colour change but soften the
  baseline weight.
- Compare against IntelliJ project picker: their item names are NOT
  bold.

---

## 📋 Information design

### #8 — In table/list view, show the framework as a badge

**Severity:** medium
**Symptom:** when viewing projects as a list (vs grid), there's no
visual indicator of which framework each project uses (Spring Boot,
Next.js, .NET). Users have to open the project to find out.

**Probable owner:**
- `src/renderer/src/browser/workspaces/projects/project-list.tsx`

**Acceptance criteria:**
- Each row shows a small `<Badge>` with the framework name + a
  framework-specific icon (Spring leaf, Next.js triangle, etc.).
- Badge uses the framework's brand color via a token (e.g.
  `bg-spring-boot/10 text-spring-boot` — define tokens if missing) or
  fall back to `secondary` variant.
- Grid view can also benefit from the badge — consistent across both
  views.

---

## 🔧 Workspace settings

### #9 — Settings panel needs a redo pass

**Severity:** medium
**Symptom:** the workspace settings panel from `redesign-03` lands but
still needs polish:
- Section ordering / grouping unclear
- Some controls misaligned with the IntelliJ-density goal
- Localization gaps (some strings English-only in pt locale)

**Probable owner:**
- `src/renderer/src/browser/workspaces/views/workspace-settings.tsx`
- `src/renderer/src/localization/locales/{en,pt}/translation.json`

**Acceptance criteria:**
- Sections grouped by domain (General / Docker / AI / Git / etc.).
- Each section has a heading + short description + the controls
  themselves.
- Save button sticky at bottom; "Reset to defaults" button alongside.
- pt translations parity with en (run `diff <(jq 'keys' en/translation.json) <(jq 'keys' pt/translation.json)` to verify).

---

## ✅ Tracking

Each item above should become a separate GitLab issue with:
- Title: `[ui-redesign] <item title>`
- Labels: `area/ui`, plus severity (`bug`, `enhancement`, `polish`)
- Linked back to this document
- Acceptance criteria copied from the section above

When closing an issue, link the MR in the issue description and mark the
corresponding item as resolved in this doc (strike-through + `RESOLVED in
!<MR-id>`).
