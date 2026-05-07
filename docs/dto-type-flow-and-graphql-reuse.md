# Fluxo do `type` no DTO e reutilização para GraphQL

Vista top-down do projeto, focada nos **ficheiros** que tocam no campo `type` do `DTOConfig`. Mostra onde o valor é fixado, por onde passa, onde é interpretado, e qual o **único ponto** que precisa mudar para reutilizar o canal para GraphQL Types.

---

## Sumário

| | |
|---|---|
| **Mecanismo dinâmico** | `DTOConfig.type: ObjectTypes` é lido em runtime pelo engine para rotear o ficheiro |
| **Uso atual no Studio** | Hardcoded como `'dto'` no `initialValues` da Contract |
| **Reutilização para GraphQL** | Clonar `DTOConfig` em memória trocando `type` por `'graphqlType'` ou `'graphqlInput'` |
| **Ficheiros a modificar** | 2 ficheiros no Renderer (camada de serviço GraphQL) |
| **Ficheiros reutilizados sem alteração** | Toda a cadeia Preload → Main → Engine |

---

## 1. Stack do fluxo (top → bottom)

```
┌─────────────────────────────────────────────────────────────┐
│  RENDERER  —  define e dispara o save                       │
├─────────────────────────────────────────────────────────────┤
│  1. Form state                                              │
│     src/renderer/src/generators/api/pages/dto/config.ts     │
│     └─ initialValues.type = 'dto'   ← ÚNICO ponto fixo      │
│                                                             │
│  2. Save handler                                            │
│     src/renderer/src/generators/api/pages/dto/useDto.ts     │
│     └─ window.engine.createDto(config, ...)                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  PRELOAD  —  bridge IPC                                     │
├─────────────────────────────────────────────────────────────┤
│  3. src/preload/index.ts                                    │
│     └─ ipcRenderer.invoke(EVENTS.SPRING.CREATE_DTO, ...)    │
│  4. src/preload/index.d.ts                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  MAIN  —  recebe IPC e delega                               │
├─────────────────────────────────────────────────────────────┤
│  5. src/main/constants/events.ts                            │
│     └─ EVENTS.SPRING.CREATE_DTO                             │
│  6. src/main/handlers/api-handler.ts                        │
│     └─ engine.createDto(dtoConfig, basePath)                │
│  7. src/main/engines/SpringEngine.ts                        │
│     └─ addDTO(config, basePath)                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  EXTERNAL ENGINE  —  interpreta `type` e roteia             │
├─────────────────────────────────────────────────────────────┤
│  8.  index.d.ts             — entry: addDTO                 │
│  9.  interfaces/types.d.ts  — DTOBaseConfig.type            │
│  10. utils/constants.d.ts   — OBJECT_TYPES (8 valores)      │
│  11. modules/dto/saveDTOConfig.d.ts  ← LÊ `type` E ROTEIA   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Estado atual — DTO normal

### 2.1 Onde o `type` é fixado

[src/renderer/src/generators/api/pages/dto/config.ts](../src/renderer/src/generators/api/pages/dto/config.ts)

- `initialValues.type = 'dto'`
- Esta é a única linha em todo o Studio que **decide** o valor de `type`.

### 2.2 Camadas de passagem cega

Cada uma destas camadas recebe o payload, **não inspeciona `type`**, e repassa-o à camada seguinte.

| # | Camada | Ficheiro |
|---|---|---|
| 2 | Save form | [src/renderer/src/generators/api/pages/dto/useDto.ts](../src/renderer/src/generators/api/pages/dto/useDto.ts) |
| 3 | Preload IPC | [src/preload/index.ts](../src/preload/index.ts) |
| 4 | Preload typings | [src/preload/index.d.ts](../src/preload/index.d.ts) |
| 5 | Main events | [src/main/constants/events.ts](../src/main/constants/events.ts) |
| 6 | Main handler | [src/main/handlers/api-handler.ts](../src/main/handlers/api-handler.ts) |
| 7 | Spring adapter | [src/main/engines/SpringEngine.ts](../src/main/engines/SpringEngine.ts) |

### 2.3 Onde o `type` finalmente importa

[node_modules/@igrp/igrp-studio-springboot-engine/dist/modules/dto/saveDTOConfig.d.ts](../node_modules/@igrp/igrp-studio-springboot-engine/dist/modules/dto/saveDTOConfig.d.ts)

- `graphqlType` / `graphqlInput` → `.igrpstudio/<module>/graphql/types/`
- Resto (`dto`, `command`, `query`, `event`, `filter`, `response`) → `.igrpstudio/<module>/dto/`

### 2.4 Schema do `type`

| Ficheiro | Conteúdo |
|---|---|
| [interfaces/types.d.ts](../node_modules/@igrp/igrp-studio-springboot-engine/dist/interfaces/types.d.ts) | `DTOBaseConfig.type: ObjectTypes` |
| [utils/constants.d.ts](../node_modules/@igrp/igrp-studio-springboot-engine/dist/utils/constants.d.ts) | `OBJECT_TYPES = ["dto", "command", "query", "event", "filter", "response", "graphqlType", "graphqlInput"]` |

**Conclusão.** O canal já é dinâmico — o Studio é que o usa de forma estática.

---

## 3. Pontos de bloqueio hoje

| Ficheiro | Sintoma |
|---|---|
| [pages/dto/config.ts](../src/renderer/src/generators/api/pages/dto/config.ts) | Único caminho que produz um `DTOConfig`, e fixa `type:'dto'` |
| [pages/graphql/service.ts](../src/renderer/src/generators/api/pages/graphql/service.ts) | `persistSchemaToEngine` chama `createGraphqlSchema` mas nunca `createDto` com `type:'graphqlType'` — engine falha por falta de `graphql/types/<Name>.json` |

---

## 4. Reutilização para GraphQL

### 4.1 Princípio

Um GraphQL Type é literalmente um `DTOConfig` com `type` diferente. Em vez de uma nova UI, **clona-se** o `DTOConfig` já existente em memória, troca-se o campo `type`, e chama-se o **mesmo** `window.engine.createDto`.

### 4.2 Camadas afetadas

```
┌─────────────────────────────────────────────────────────────┐
│  RENDERER GRAPHQL — única zona de mudança                   │
├─────────────────────────────────────────────────────────────┤
│  src/renderer/src/generators/api/pages/graphql/             │
│     useGraphQLOperation.ts  — passa dto[] ao service        │
│     service.ts              — clona DTO e troca `type`      │
└─────────────────────────────────────────────────────────────┘
                            ↓
                  resto da stack inalterada
                  (Preload → Main → Engine)
```

### 4.3 Ficheiros que mudam

| Ficheiro | Função |
|---|---|
| [src/renderer/src/generators/api/pages/graphql/service.ts](../src/renderer/src/generators/api/pages/graphql/service.ts) | Adicionar `ensureTypeManifest` e `ensureInputManifest` que clonam o DTO source com novo `type` e chamam `window.engine.createDto` |
| [src/renderer/src/generators/api/pages/graphql/useGraphQLOperation.ts](../src/renderer/src/generators/api/pages/graphql/useGraphQLOperation.ts) | Encaminhar `dto[]` (já disponível via `useStudioAPI`) ao `GraphQLService` |

### 4.4 Ficheiros reutilizados sem alteração

| Camada | Ficheiro |
|---|---|
| Fonte de dados DTO | [src/renderer/src/hooks/use-studio-api.ts](../src/renderer/src/hooks/use-studio-api.ts) |
| Preload | [src/preload/index.ts](../src/preload/index.ts) |
| Preload typings | [src/preload/index.d.ts](../src/preload/index.d.ts) |
| Main events | [src/main/constants/events.ts](../src/main/constants/events.ts) |
| Main handler | [src/main/handlers/api-handler.ts](../src/main/handlers/api-handler.ts) |
| Main interfaces | [src/main/interfaces.d.ts](../src/main/interfaces.d.ts) |
| Spring adapter | [src/main/engines/SpringEngine.ts](../src/main/engines/SpringEngine.ts) |
| External engine | `node_modules/@igrp/igrp-studio-springboot-engine` |

### 4.5 Fora de escopo

| Ficheiro | Motivo |
|---|---|
| [pages/dto/config.ts](../src/renderer/src/generators/api/pages/dto/config.ts) | Contract editor continua a criar `type:'dto'` |
| [pages/dto/useDto.ts](../src/renderer/src/generators/api/pages/dto/useDto.ts) | Fluxo do DTO normal não muda |

---

## 5. Comparação lado a lado

|   | DTO normal (hoje) | GraphQL Type (reutilização) |
|---|---|---|
| Origem do `type` | [pages/dto/config.ts](../src/renderer/src/generators/api/pages/dto/config.ts) — `initialValues` | [pages/graphql/service.ts](../src/renderer/src/generators/api/pages/graphql/service.ts) — clone do DTO source |
| Valor de `type` | `'dto'` | `'graphqlType'` ou `'graphqlInput'` |
| Disparo | User grava form Contract | Save de operation com `returnType` não-primitivo |
| IPC | `window.engine.createDto` | `window.engine.createDto` |
| Handler Main | `SpringEngine.createDto` | `SpringEngine.createDto` |
| Engine entry | `addDTO` | `addDTO` |
| Pasta destino | `.igrpstudio/<module>/dto/` | `.igrpstudio/<module>/graphql/types/` |
| Decidido por | Engine, ao ler `config.type` | Engine, ao ler `config.type` |

---

## 6. Documentos relacionados

| Ficheiro | Para quê |
|---|---|
| [docs/graphql-auto-type-plan.md](./graphql-auto-type-plan.md) | Proposta detalhada, fluxo de dados, critérios de aceitação |
| [docs/graphql-auto-type-checklist.md](./graphql-auto-type-checklist.md) | Passos de implementação prontos a executar |
| Este documento | Visão de ficheiros e camadas |
