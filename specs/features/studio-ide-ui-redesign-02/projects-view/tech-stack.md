# Projects View Redesign — Tech Stack & Component Map

The rule for picking components, plus the scaffold → real-component map for each
part. Architectural choices are recorded in `decisions.md`.

## Component selection rule (R1 / R2 / R3)

1. **Components:** use the repo's own **local** components in
   `@renderer/components/ui/*` and existing helpers (`ProjectIcon`, `SearchInput`,
   `Dependency`, `PortsBadgeList`, `ProjectActions`). The external `@igrp/...`
   package is **not** used here.
2. **Icons:** `lucide-react`, imported directly (`<FolderKanban/>`, `<Clock/>`,
   `<MoreVertical/>`).
3. **Colors:** semantic design tokens only — map the scaffold's hardcoded colors:

| Scaffold | Token |
|---|---|
| `bg-white` (card) | `bg-card` |
| `text-teal-600/700`, `border-teal-500` (accent/hover) | `text-primary`, `border-primary` |
| `text-slate-900` | `text-foreground` |
| `text-slate-400/500/300` | `text-muted-foreground` (lighten via opacity where needed) |
| `border-slate-200/100/50` | `border` / `border-border` |
| `bg-slate-50/100` (chips, pills) | `bg-muted` / `bg-secondary` |
| `bg-blue-50 text-blue-700` (deps hover) | no blue token → use `secondary`/`muted` badge (see decision GC4) |

---

## Part 1 — Header bar ✓ complete

Implemented in `ResourceSection` (`src/renderer/src/browser/workspaces/index.tsx`):
single-row layout; inline icon+title+count; local `SearchInput`; ghost
filter-icon (`<ListFilter/>`) + `DropdownMenu` sort; local `ToggleGroup` view
switch; borderless ghost 3-dot; existing `ProjectWizard` for New project. All repo
components + lucide + tokens. See decisions A–H.

---

## Part 2 — Grid-view project card ✓ done

**Where:** the per-project `Card` rendered by `ProjectGrid`
(`src/renderer/src/browser/workspaces/projects/project-grid.tsx`).
**Reuse:** `ProjectData`; the matched Docker **service** (ports via
`service.ports`, deps via `service.dependsOn`, from `findServiceByProjectName`);
`saveOrOpenProject`; `ProjectActions`; `formatDistanceToNow` (`date-fns`).

**Card shell:** local `Card`. `rounded-lg border p-3 h-[130px] flex flex-col
justify-between bg-card group transition-all hover:border-primary hover:shadow-md`.
Three regions stacked by `justify-between`: header / dependencies / footer.

### Component map (scaffold region → repo component)

| Region | Scaffold element | Real component | Notes / decision |
|---|---|---|---|
| Header | Icon chip | `ProjectIcon` (existing, already a 32px chip) **or** `<FolderKanban/>` chip | **GC2** — pick which icon. `text-muted-foreground group-hover:text-primary` |
| Header | Title | `<h4>` / `<span>` | `text-[13px] font-bold text-foreground tracking-tight truncate leading-tight group-hover:text-primary` |
| Header | Description (sub-row) | `<span>` (truncated) | **GC3** — real CSS `truncate` vs the scaffold "This is…" quirk. `text-[9px] text-muted-foreground truncate`; sub-row `opacity-60 group-hover:opacity-100` |
| Header | Port `3000:3000` | `<span>` (from `service.ports`) | only if a port exists; `text-[9px] font-bold text-primary/70 lowercase`, preceded by a `\|` divider |
| Deps | Dependency list (collapsed + expand-on-hover) | local `HoverCard`/`Popover` + `Badge` **or** faithful `motion` panel | **GC4**. Collapsed: first dep `Badge` + `+N` pill; expand shows all deps. Data: `service.dependsOn`. Empty → fixed-height spacer to keep card height stable |
| Footer | Updated time | `<Clock/>` + `formatDistanceToNow(project.updatedAt)` | left; `text-[9px] text-muted-foreground opacity-60` |
| Footer | 3-dot | `ProjectActions` (existing) moved here, **or** bare ghost `Button`+`<MoreVertical/>` | **GC5**. Ghost icon button, `h-7 w-7`, idle muted, open → `bg-muted text-primary` |
| — | Open project | card click / small button / via 3-dot | **GC1** — the scaffold has **no** Open button; decide how opening works |

**Group-hover interactions to preserve:** card border → primary + shadow; icon &
title → primary; description sub-row opacity 60 → 100; dependency pill expands to
the full list.

### Notes

- Ports & dependencies come from the **matched Docker service**, not the project
  record. Currently both are gated on `ports.length > 0`; the card should show
  dependencies independently of ports (**GC6**).
- `motion` (v12) is installed, so a faithful animated deps panel is *possible* —
  but the rule (repo-local + simple) favors a local `HoverCard`/`Popover` (GC4).
- No `ProjectDependencyList` / `stripPrefix` exist yet — they are scaffold-only;
  we adapt the existing `Dependency` component or compose `Badge`s.

## Constraints (R4)

- Evolve `ProjectGrid` in place; reuse its data wiring and handlers.
- No hardcoded colors — tokens only.
- Don't break opening a project or the actions menu.

## Grid-card decisions — resolved (see `decisions.md`)

GC1 whole-card click · GC2 framework `ProjectIcon` · GC3 real truncation ·
GC4 local `HoverCard` · GC5 relocate `ProjectActions` · GC6 deps from service,
shown independently of ports.

---

## Part 3 — List-view rows (current)

**Where:** `ProjectList` (`src/renderer/src/browser/workspaces/projects/project-list.tsx`).
**Reuse:** `ProjectData`; the matched Docker **service** for ports/deps (same
matching as the grid); `saveOrOpenProject` (row click); `ProjectActions`.

**Shell:** replace the semantic `<Table>` with a CSS-grid "table" — a header row +
a rows block — sharing one column template so columns align:

```
grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_80px_36px]  gap-2
            Name           Framework      Ports          Dependencies     Updated  ⋮
```

The `0` min lets cols 1–4 truncate instead of overflow. Add ARIA
`role="table" / row / columnheader / cell` since we leave the semantic table (LD3).

- **Header row:** `grid … gap-2 py-1 border-b text-[10px] uppercase tracking-wider text-muted-foreground font-bold`; labels Name·Framework·Ports·Dependencies·Updated (right) + empty 3-dot cell.
- **Rows block:** `divide-y`; each row `grid items-center gap-2 px-1 py-1.5 text-xs group hover:bg-muted/50 transition-colors cursor-pointer`; row click → open (LD4).

### Component map (scaffold column → repo)

| Col | Scaffold | Real | Notes / decision |
|---|---|---|---|
| 1 Name | folder + name | `<FolderKanban/>` + `<span>` | `h-3.5 w-3.5 text-muted-foreground shrink-0` + `truncate font-medium text-foreground` |
| 2 Framework | text | `<span>` | `text-muted-foreground font-medium` — drops the current `Badge` (LD5) |
| 3 Ports | chip `3000:3000` | `<span>`/`Badge` chip | from `service.ports[0]`; `bg-muted text-muted-foreground border rounded-md px-1.5 text-[10px] font-mono group-hover:bg-background` |
| 4 Dependencies | chip + `Database` icon | `<Database/>` + chip/`Badge` | **LD1** — real deps (first + `+N`) vs scaffold's fake `{name}-db` |
| 5 Updated | compact `3d`/`now` | `<span>` | **LD2** — compact helper vs full `formatDistanceToNow`; `text-muted-foreground text-right whitespace-nowrap` |
| 6 3-dot | hover ghost | `ProjectActions` | hover-revealed (its default); menu contents out of scope |

**Interactions to preserve:** full-row hover tint; ports chip → `bg-background` on
row hover; 3-dot fades in on hover; header labels fixed while rows scroll.

### List decisions — see `decisions.md`

LD1 deps · LD2 updated format · LD3 grid+ARIA · LD4 row-click · LD5 framework text ·
LD6 drop description. (LD1–LD2 need sign-off; LD3–LD6 proposed.)

---

## Part 4 — New Project modal (current)

**Where:** `ProjectWizard` (`src/renderer/src/browser/project/project-form.tsx`),
its config sub-components (`SpringConfig`, `NextConfig`, `DotNetConfig`,
`SpecificationConfig`), and `components/step-button.tsx`.

**Preserve (NP4 — do not break):** react-hook-form + Zod validation, the
`saveOrOpenProject` submit, icon upload (`window.api.saveProjectIcon` /
`getIconFile`), managed-path computation, dependency loading
(`window.engine.getDependencies`), the framework config sub-components, theme color
(frontend).

**Structure (NP1 — 2 steps):**
- **Step 1** — Project Type (3 cards) + Generator (framework cards + search).
- **Step 2** — Project Details (icon uploader + name/desc/location/git) +
  framework-specific config + dependencies.
- Moves name/icon out of the old step 1 into step 2; merges old Configure + Summary.

**Shell:** reuse the shadcn `Dialog` / `DialogContent` (built-in overlay/animation —
no framer). Internal layout: header bar (chip + "New Project" + close) / body
(sidebar stages + content) / footer (nav).

### Component map (scaffold → repo)

| Region | Real component |
|---|---|
| Modal shell | shadcn `Dialog` / `DialogContent` (restyled) |
| Header chip / close | `<Plus>` in a token chip; `DialogClose` + `<X>` |
| Sidebar stages | restyle `StepButton`: numbered circle, `<Check>` when done, title + summary line |
| Project Type cards | custom buttons + `Monitor` / `Database` / `Sparkles` |
| Framework cards | custom buttons + existing `FrameworkIcon` + search `Input` |
| Project Details | icon uploader (existing) + `Input` / `Textarea` + location `RadioGroup` + git `Checkbox` |
| Framework config | reuse `SpringConfig` / `NextConfig` / `DotNetConfig` / `SpecificationConfig` |
| Footer nav | shadcn `Button` (secondary Cancel/Back; primary Next/Create + spinner) |
| Icons | lucide direct: `Plus` `X` `Search` `Monitor` `Database` `Sparkles` `ChevronRight` `ChevronDown` `Check` `FolderOpen` `Palette` `Loader2` |

**Color:** tokens (gray; teal deferred via scoped `--primary`, NP3).
**Options:** real supported only (NP2). See `decisions.md` NP1–NP5.
