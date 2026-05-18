# Plano de limpeza e otimização de dependências — `igrp-studio-ide`

Base: análise cruzada do `package.json` com o uso real em `src/` (2026-04-29).
Objetivo: reduzir tamanho do bundle/instalador, eliminar sobreposições e modernizar libs em fim de vida.

**Estado:** Fase 1, 1.5, 2.1, 2.4 e 3.5 concluídas. 3.1 destrancada (pacote em falta no `package.json` para código já migrado no HEAD).

---

## Fase 1 — Remoções seguras ✅ COMMITTED

Pacotes declarados mas **não importados** em `src/`. Removidos de `dependencies`.

- [x] `axios` — 0 usos
- [x] `embla-carousel-react` — 0 usos
- [x] `vaul` — 0 usos
- [x] `@hookform/resolvers` — 0 usos
- [x] ~~`path-browserify`~~ — **revertido**: usado via alias `electron.vite.config.ts` para shimar `require("path")` no renderer
- [x] `process` — 0 usos (polyfill desnecessário)
- [x] `json-schema-faker` — 0 usos
- [x] `redux` — RTK arrasta; substituído import por `@reduxjs/toolkit` em 2 ficheiros
- [x] `reselect` — substituído import por `@reduxjs/toolkit` (`createSelector`) em 8 ficheiros

**Movidos para `devDependencies`:**
- [x] `@types/express`, `@types/jest`, `@types/lodash-es`, `ts-jest`

**Alinhamentos:**
- [x] `@types/node`: `^25` → `^20` (Electron 40 usa Node 20)

**Commits:** `909d9233`, `02ee2036` (fix path-browserify), `360d0ddf` (lição no plano).

---

## Fase 1.5 — Remoções adicionais (descobertas no checkup) ⏳ WORKING TREE

Identificadas no segundo passe (incluindo `src/main` + configs):

- [x] `cmdk` — 0 refs (transitiva via `@igrp/igrp-framework-react-design-system`, mantém-se na árvore)
- [x] `dockerode` — 0 refs (`docker-service.ts` usa `child_process`/CLI)
- [x] `electron-window-state` — 0 refs
- [x] `update-electron-app` — 0 refs (`electron-updater` já é o ativo, 2 usos em main)

**Estado:** removidos do `package.json` e `yarn.lock`, **ainda sem commit**.

---

## Fase 2 — Consolidação de sobreposições

### 2.1 Markdown (3 engines → 2) ✅ WORKING TREE
- [x] `react-markdown` — 3 ficheiros (UI). **Mantém-se.**
- [x] `marked` — **removido**. Migrado [spec-doc-export-service.ts](src/main/services/spec-doc-export-service.ts) para `markdown-it`.
- [x] `markdown-it` — agora é o único processador não-React (renderer + main).

### 2.2 Substituir `dompurify` por `rehype-sanitize` ❌ ADIADO
- [ ] Ganho marginal: substituiria 2 deps (`dompurify`, `highlight.js`) por 2 outras (`rehype-sanitize`, `rehype-highlight`).
- `markdown-it` continuaria necessário no main process — não desaparece.
- **Adiar** para PR dedicado quando consolidarmos toda a UI markdown em `react-markdown`.

### 2.3 Validar drivers de BD 🚫 CONGELADO
- Drivers presentes: `pg` (6 usos diretos), `mysql2` (dinâmico via Knex), `oracledb` (dinâmico via Knex).
- UI [ConnectionForm.tsx](src/renderer/src/features/data-models/connection/ConnectionForm.tsx) lista 6 opções: `postgres`, `mysql`, `mongodb`, `sqlite`, `oracle`, `mssql`.
- **Bug latente:** `mongodb`, `sqlite`, `mssql` na UI sem driver instalado → crash em runtime se escolhidos.
- **Não mexer por agora** (decisão do utilizador). Não abrir PR sem nova diretiva.

### 2.4 Cache de servidor: RTK Query vs React Query ✅ AUDITADO
- Auditoria: `@tanstack/react-query` em 4 ficheiros (BPMN externo HTTP), Redux Toolkit em 7 slices + 5 thunks (estado UI + sincronização IPC). **Sem duplicação.**
- **Veredicto:** separação saudável; nenhuma migração a fazer.

---

## Fase 3 — Substituições por alternativas mais eficientes

### 3.1 `reactflow` → `@xyflow/react` ⚠️ PARCIAL
- [x] Código já migrado no HEAD em 2 ficheiros ([ReactFlowERD.tsx](src/renderer/src/features/data-models/diagram/ReactFlowERD.tsx), [workspace-diagram.tsx](src/renderer/src/browser/workspaces/views/workspace-diagram.tsx)) por trabalho prévio da equipa.
- [x] **Adicionado `@xyflow/react ^12.8.6` ao package.json** (estava em falta); removido `reactflow`.
- [ ] **Pendente:** corrigir ~10 erros TS dos v12 generics (`Node<T extends Record<string, unknown>>`, `useNodesState` precisa de tipo explícito). Pré-existentes no HEAD.

### 3.2 `highlight.js` → `shiki` (opcional) ❌ ADIADO
- Único uso em [markdown-renderer.ts](src/renderer/src/features/markitdown/utils/markdown-renderer.ts).
- Faz parte do pacote 2.2 acima — adiar com ele.

### 3.3 `dotenv` → `--env-file` nativo ❌ NÃO COMPENSA
- Único uso: [src/main/helpers/env.ts](src/main/helpers/env.ts) — `dotenv.config()` no arranque.
- `--env-file` do Node não passa via `electron-vite dev`; `process.loadEnvFile()` é experimental no Node 20.
- `dotenv` é ~5kb, estável. **Manter.**

### 3.4 `html-to-docx` → `docx` ⏳ ADIADO (alto esforço)
- Único uso em [spec-doc-export-service.ts](src/main/services/spec-doc-export-service.ts).
- `docx` exige construir o documento programaticamente (perde-se o pipeline `markdown → HTML → docx`).
- Reescrita significativa (~1-2 dias). PR dedicado.

### 3.5 `lodash-es` → utilities locais ✅ WORKING TREE
- [x] Identificado: 4 ficheiros, todos importam apenas `camelCase`.
- [x] Criada função `camelCase` em [src/renderer/src/utils/index.ts](src/renderer/src/utils/index.ts) (cobre os casos: kebab, snake, camel, espaços).
- [x] Migrados 4 ficheiros para `@renderer/utils`.
- [x] Removidos `lodash-es` e `@types/lodash-es`.

---

## Fase 4 — Migração de longo prazo

### 4.1 Formik + Yup → React Hook Form + Zod ⏳ FUTURO
Estado atual (re-grep mais amplo): Formik em **37 ficheiros**, Yup em **15**, Zod em **4**.
Motivos:
- Formik em modo manutenção.
- RHF: ~50% menos re-renders, bundle menor.
- Zod: melhor inferência TS, tree-shaking superior.

Estratégia:
- [ ] Migrar **feature a feature**, não tudo de uma vez.
- [ ] Começar por forms simples (ex.: [duplicate-page-modal.tsx](src/renderer/src/generators/ui/browser/components/duplicate-page-modal.tsx)).
- [ ] Ordem sugerida: modais simples → forms de criação → forms complexos (ConnectionForm, project-form).
- [ ] Cada PR migra 1–3 ficheiros, com validação visual.
- [ ] Quando 0 ficheiros usarem Formik/Yup, remover dependencies.

### 4.2 Limpeza de UI sem driver BD (ligado a 2.3) ⏸️
- Remover opções `mongodb`/`sqlite`/`mssql` de [ConnectionForm.tsx:17-25](src/renderer/src/features/data-models/connection/ConnectionForm.tsx) até haver drivers instalados, **ou** decidir suportar mais SGBDs.

---

## Resumo do progresso

| Fase | Estado | Pacotes movidos |
|---|---|---|
| 1 | ✅ committed | -7 deps removidas, 4 reclassificadas, 1 alinhamento |
| 1.5 | ⏳ working tree | -4 deps removidas |
| 2.1 | ⏳ working tree | -1 dep (`marked`) |
| 2.2 | ❌ adiado | 0 |
| 2.3 | ⏸️ decisão equipa | até -1 (`oracledb` ~100MB) |
| 2.4 | ✅ nada a fazer | 0 |
| 3.1 | ⏳ working tree (incompleto) | `reactflow` → `@xyflow/react` |
| 3.2 | ❌ adiado (ligado a 2.2) | 0 |
| 3.3 | ❌ não compensa | 0 |
| 3.4 | ⏳ adiado | -1 quando feito |
| 3.5 | ⏳ working tree | -1 dep + 1 devDep (`lodash-es`, `@types/lodash-es`) |
| 4.1 | ⏳ futuro longo | -2 deps eventuais |

**No working tree, pronto para commit:**
- Remoções Fase 1.5: `cmdk`, `dockerode`, `electron-window-state`, `update-electron-app`
- Remoções Fase 2.1: `marked`
- Remoções Fase 3.5: `lodash-es`, `@types/lodash-es`
- Adição Fase 3.1: `@xyflow/react` (destranca código já migrado no HEAD)
- Total: **-7 deps, +1 dep, -1 devDep**

---

## Como vamos seguindo

- Cada fase é um (ou mais) PR(s) separado(s).
- Marcar `[x]` à medida que completamos.
- Em cada PR: typecheck + build + testes manuais das features tocadas.
- Bloqueadores ou decisões abertas: anotar abaixo.

## Decisões abertas

- **2.3 / 4.2 — SGBDs suportados oficialmente:** 🚫 **Congelado por instrução do utilizador.** Não retomar sem nova diretiva. Quando reabrir: decidir se `oracledb` fica (poupa ~100MB), e remover opções da UI sem driver.
- ~~3.1 — completar fix dos erros TS do xyflow v12~~ ✅ resolvido em `9b811c5e`.

## Lições

- **Sempre verificar `electron.vite.config.ts` (alias, define, optimizeDeps) antes de remover deps.** Na Fase 1 removi `path-browserify` por aparentar não ter imports, mas é consumido via alias `path → path-browserify` para shimar `require("path")` em `i18next-electron-fs-backend` no renderer.
- **Verificar carga dinâmica em libs como Knex.** `mysql2`/`oracledb` não têm imports diretos mas são carregados por `knex({ client })` em runtime — não dá para remover só por grep de imports.
- **Verificar HEAD antes de migrar libs.** Na Fase 3.1 descobri que `@xyflow/react` já estava no código mas em falta no `package.json` — havia uma migração inacabada da equipa. Procurar divergências `código vs deps` antes de assumir trabalho do zero.
