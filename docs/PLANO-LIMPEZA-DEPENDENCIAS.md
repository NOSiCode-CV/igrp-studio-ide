# Plano de limpeza e otimização de dependências — `igrp-studio-ide`

Base: análise cruzada do `package.json` com o uso real em `src/` (2026-04-29).
Objetivo: reduzir tamanho do bundle/instalador, eliminar sobreposições e modernizar libs em fim de vida.

---

## Fase 1 — Remoções seguras (zero risco)

Pacotes declarados mas **não importados** em `src/`. Remover de `dependencies`.

- [ ] `axios` — 0 usos (tudo via `fetch` ou clients dedicados).
- [ ] `embla-carousel-react` — 0 usos.
- [ ] `vaul` — 0 usos.
- [ ] `@hookform/resolvers` — 0 usos (projeto usa Formik+Yup).
- [ ] `path-browserify` — 0 usos (polyfill desnecessário com Vite).
- [ ] `process` — 0 usos (polyfill desnecessário).
- [ ] `json-schema-faker` — 0 usos (substituído por `@faker-js/faker`).
- [ ] `redux` — RTK já o arrasta; remover entrada explícita.
- [ ] `reselect` — RTK reexporta `createSelector`; substituir imports por `@reduxjs/toolkit` e remover.

**Mover para `devDependencies`:**
- [ ] `@types/express`
- [ ] `@types/jest`
- [ ] `@types/lodash-es`
- [ ] `ts-jest`

**Alinhamentos:**
- [ ] `@types/node`: `^25` → `^20` (Electron 40 usa Node 20).

**Validação Fase 1:** `yarn install && yarn typecheck && yarn build`.

---

## Fase 2 — Consolidação de sobreposições

### 2.1 Markdown (3 engines → 2)
Estado atual:
- `react-markdown` — 3 ficheiros (UI). **Manter.**
- `marked` — 1 ficheiro: [spec-doc-export-service.ts](src/main/services/spec-doc-export-service.ts).
- `markdown-it` — 1 ficheiro: [markdown-renderer.ts](src/renderer/src/features/markitdown/utils/markdown-renderer.ts).

Decisão a tomar:
- [ ] Escolher entre `marked` e `markdown-it` para o pipeline não-React.
  - Recomendação: **`markdown-it`** (mais extensível, ecossistema rico, alinha com `remark-gfm`).
  - Migrar [spec-doc-export-service.ts](src/main/services/spec-doc-export-service.ts) para `markdown-it`.
- [ ] Remover o pacote excluído.

### 2.2 Substituir `dompurify` por `rehype-sanitize`
- [ ] Avaliar [markdown-renderer.ts](src/renderer/src/features/markitdown/utils/markdown-renderer.ts) — se passar a usar pipeline remark/rehype, `rehype-sanitize` cobre o caso e remove `dompurify`.

### 2.3 Validar drivers de BD
Drivers presentes: `pg`, `mysql2`, `oracledb`, `knex`, `knex-schema-inspector`.
- [ ] Confirmar com PM/equipa quais SGBDs são realmente suportados em produção.
- [ ] Se `oracledb` não for crítico, removê-lo reduz o instalador (binários nativos pesados).

### 2.4 Cache de servidor: RTK Query vs React Query
- [ ] Auditar usos de `@tanstack/react-query` e RTK slices que façam fetch.
- [ ] Se houver duplicação, padronizar num só (recomendação: **React Query** para data fetching, RTK só para estado de UI).

**Validação Fase 2:** typecheck + smoke test manual das features afetadas (markdown preview, exportação docx, conexões BD).

---

## Fase 3 — Substituições por alternativas mais eficientes

### 3.1 `reactflow` → `@xyflow/react`
- [ ] Reactflow está deprecated; `@xyflow/react` é o sucessor oficial.
- [ ] Ficheiros afetados:
  - [ReactFlowERD.tsx](src/renderer/src/features/data-models/diagram/ReactFlowERD.tsx)
  - [workspace-diagram.tsx](src/renderer/src/browser/workspaces/views/workspace-diagram.tsx)
- [ ] Migração: trocar imports + ajustar pequenas mudanças de API. Documentado em https://reactflow.dev/learn/troubleshooting/migrate-to-v12.

### 3.2 `highlight.js` → `shiki` (opcional)
- [ ] `shiki` dá realce VS Code-like e combina com Monaco já presente.
- [ ] Único ponto de uso: [markdown-renderer.ts](src/renderer/src/features/markitdown/utils/markdown-renderer.ts).
- [ ] Avaliar custo/benefício (bundle vs qualidade visual).

### 3.3 `dotenv` → `--env-file` nativo
- [ ] Node 20+ tem `--env-file` nativo; Electron 40 herda.
- [ ] Avaliar [main/index.ts](src/main/index.ts) e [helpers/env.ts](src/main/helpers/env.ts).
- [ ] Alternativa: usar `electron-store` que já está nas deps.

### 3.4 `html-to-docx` → `docx`
- [ ] `html-to-docx` tem manutenção fraca.
- [ ] Único uso: [spec-doc-export-service.ts](src/main/services/spec-doc-export-service.ts).
- [ ] `docx` é mais flexível e mantido ativamente.

### 3.5 `lodash-es` → nativos ES2023
- [ ] Auditar usos reais (`grep -rn "from 'lodash-es'" src`).
- [ ] Substituir por `Object.groupBy`, `structuredClone`, `Array.prototype.toSorted`, etc., onde aplicável.
- [ ] Manter `lodash-es` apenas se houver helpers sem equivalente nativo.

**Validação Fase 3:** typecheck + build + testes (`yarn test`) + smoke manual nas features (ERD, markdown, export docx, env vars).

---

## Fase 4 — Migração de longo prazo

### 4.1 Formik + Yup → React Hook Form + Zod
Estado atual: Formik em 19 ficheiros, Yup em 15.
Motivos:
- Formik está em modo manutenção.
- RHF: ~50% menos re-renders, bundle menor.
- Zod: melhor inferência TS, tree-shaking superior.

Estratégia:
- [ ] Migrar **feature a feature**, não tudo de uma vez.
- [ ] Começar por forms simples (ex.: [duplicate-page-modal.tsx](src/renderer/src/generators/ui/browser/components/duplicate-page-modal.tsx)).
- [ ] Ordem sugerida: modais simples → forms de criação → forms complexos (ConnectionForm, project-form).
- [ ] Cada PR migra 1–3 ficheiros, com validação visual.
- [ ] Quando 0 ficheiros usarem Formik/Yup, remover dependencies.

---

## Resumo de ganhos esperados

| Métrica | Estimativa |
|---|---|
| Pacotes removidos (Fase 1) | ~9 deps + 4 mal classificadas |
| Pacotes removidos (Fase 2) | 1–2 (markdown engine, dompurify, oracledb opcional) |
| Pacotes substituídos (Fase 3) | 4–5 |
| Pacotes substituídos (Fase 4) | 2 (formik, yup) |
| Redução estimada `node_modules` produção | 40–80 MB (sobretudo se oracledb sair) |

---

## Como vamos seguindo

- Cada fase é um (ou mais) PR(s) separado(s).
- Marcar `[x]` à medida que completamos.
- Em cada PR: typecheck + build + testes manuais das features tocadas.
- Bloqueadores ou decisões abertas: anotar em comentário no fim deste ficheiro.

## Decisões abertas

_(preencher à medida que surgirem)_

## Lições

- **Sempre verificar `electron.vite.config.ts` (alias, define, optimizeDeps) antes de remover deps.** Na Fase 1 removi `path-browserify` por aparentar não ter imports, mas é consumido via alias `path → path-browserify` para shimar `require("path")` em `i18next-electron-fs-backend` no renderer. Restaurado no commit seguinte.
