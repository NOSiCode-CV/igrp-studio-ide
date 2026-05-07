# Plano — Combobox de Kind no Contract editor

Adicionar um combobox `Kind` no topo do Contract editor que controla `DTOConfig.type`. O user escolhe entre **DTO**, **GraphQL Type** ou **GraphQL Input**. O resto do form, o pipeline IPC e o engine ficam inalterados — o engine externo já aceita os 3 valores e roteia por `type`.

---

## Premissa

O engine externo já suporta `graphqlType` e `graphqlInput` (estão em `OBJECT_TYPES`). Não há geração nova a fazer no Main nem no engine — só destrancar os valores no Renderer através de UI.

---

## Decisões

| | |
|---|---|
| **Onde vive o combobox** | Contract editor existente — não criar editor novo |
| **Opções V1** | `dto`, `graphqlType`, `graphqlInput` |
| **Default** | `dto` (mantém comportamento atual) |
| **Trocar Kind no meio da edição** | Manter atributos; validação no save apanha incompatíveis |
| **Discoverability via menu GraphQL** | Defer para V1.1 (entrada no menu GraphQL que abre o editor com `Kind` pré-selecionado) |
| **Sidebar (agrupar GraphQL Types em secção própria)** | Defer |

---

## Ficheiros

| Ficheiro | Mudança |
|---|---|
| [pages/dto/config.ts](../src/renderer/src/generators/api/pages/dto/config.ts) | Adicionar `KIND_OPTIONS` (array `{label, value}` com 3 entradas) |
| [pages/dto/index.tsx](../src/renderer/src/generators/api/pages/dto/index.tsx) | Renderizar `<Combobox>` ligado a `formik.values.type` |
| [pages/dto/useDto.ts](../src/renderer/src/generators/api/pages/dto/useDto.ts) | Garantir que `handleSave` envia `values.type` (não força `'dto'`) |
| [pages/dto/validation.ts](../src/renderer/src/generators/api/pages/dto/validation.ts) | (opcional) regras condicionais por `type` |
| [pages/graphql/useGraphQLOperation.ts](../src/renderer/src/generators/api/pages/graphql/useGraphQLOperation.ts) | Dropdown `returnType`/`inputType` lista também GraphQL Types/Inputs do módulo |

**Não tocar:** preload, main handler, SpringEngine, engine externo.

---

## Passos

1. Criar `KIND_OPTIONS` em `pages/dto/config.ts`.
2. Adicionar `<Combobox>` no topo do form do Contract editor.
3. Verificar que `handleSave` propaga `values.type`.
4. Atualizar dropdowns de `returnType`/`inputType` em `useGraphQLOperation.ts`.
5. Teste manual dos 3 caminhos (DTO, GraphQL Type, GraphQL Input).
6. Commit.

---

## Fluxo resultante

**Criar GraphQL Type:** Contract editor → user escolhe `Kind=GraphQL Type` → `formik.values.type='graphqlType'` → `window.engine.createDto` → engine roteia para `.igrpstudio/<module>/graphql/types/<Name>.json` + Java em `graphql/type/`.

**Criar Operation que o consome:** Operation editor → `returnType` lista o tipo recém-criado → save → `createGraphqlSchema` encontra o manifest e gera `.graphqls` + resolvers.

---

## Critérios de aceitação

- [ ] Combobox visível com 3 opções; default `DTO`
- [ ] Ao editar item existente, combobox reflete o `type` salvo
- [ ] Trocar de Kind não apaga atributos
- [ ] Save com cada Kind grava na pasta correta em disco
- [ ] Operation com `returnType` apontando para GraphQL Type criado via combobox passa sem `"GraphQL type manifest not found"`
- [ ] Projeto Spring Boot gerado compila

---

## Iteração futura (V1.1)

- Entrada no menu/sidebar GraphQL que abre o Contract editor com `Kind=GraphQL Type` pré-selecionado.
- Agrupar GraphQL Types/Inputs numa secção própria da sidebar.
- Suporte a referência cruzada `graphqlType` → `graphqlType` no picker de atributos.

---
