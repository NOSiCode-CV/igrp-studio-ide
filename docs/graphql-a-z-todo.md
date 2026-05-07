# GraphQL A-Z — Cadeia Completa e TO-DO

## Contexto do projecto

`igrp-studio-horizon` é um IDE desktop (Electron + React + TypeScript) de low-code.
O Studio modela artefactos visualmente, persiste definições em JSON e delega geração de
código a engine packages externos (Spring Boot, Next.js, .NET).

A cadeia GraphQL tem duas partes distintas e separadas por design:

| Canal | Responsabilidade |
|-------|-----------------|
| `window.graphql` | CRUD do manifest em `.igrpstudio/<module>/graphql/graphql.json` — **apenas persistência** |
| `window.engine` | Geração de artefactos no projecto backend — **apenas geração** |

Misturar estes dois canais é uma violação de arquitectura documentada.

---

## Estado actual (2026-05-05)

| Fase | Estado | Notas |
|------|--------|-------|
| Phase 1 — Manifest | ✅ Implementado | tipos, service, handler, persistência |
| Phase 2 — UI Mapping | ✅ Implementado | forms, mapper, validação, sidebar |
| Phase 3 — Validation | ✅ Implementado | bloqueio de save em dados inválidos |
| Phase 4 — Generator | ✅ Implementado e testado | `window.engine.createGraphqlSchema` activo, Java + `.graphqls` gerados |
| Phase 5 — Integration | ⚠️ Parcial | geração dispara no save mas engine tem bugs de SDL |
| Phase 6 — Improvements | ❌ Não implementado | fora de âmbito por agora |

---

## Cadeia A-Z — O caminho completo até ao Postman

### [STUDIO — Phases 1-3] Passo 1 — Formulário UI → Manifest object
**Ficheiro:** `src/renderer/src/generators/api/pages/graphql/index.tsx`  
**O que faz:** O utilizador define operações (Query/Mutation/Subscription), argumentos,
tipos de retorno, input types e return mode no formulário React gerido pelo Formik.  
**Input:** interacção do utilizador  
**Output:** objecto `GraphqlManifest` em memória  
**Estado:** ✅ Implementado

---

### [STUDIO — Phase 3] Passo 2 — Validação antes de save
**Ficheiro:** `src/renderer/src/generators/api/pages/graphql/validation.ts`  
**O que faz:** Valida nomes únicos por tipo de operação, return type obrigatório,
input type obrigatório em mutations, event topic obrigatório em subscriptions.
Bloqueia save se inválido.  
**Input:** estado do formulário  
**Output:** erro de validação ou autorização de save  
**Estado:** ✅ Implementado

---

### [STUDIO — Phase 2] Passo 3 — Sanitize/map → `window.graphql.save`
**Ficheiro:** `src/renderer/src/generators/api/pages/graphql/service.ts`  
`src/renderer/src/generators/api/pages/graphql/mapper.ts`  
**O que faz:** Mapeia o estado do formulário para a estrutura canónica do manifest.
Chama `window.graphql.save(manifest)` via preload.  
**Correcção aplicada (2026-05-04):** `buildSchemaConfig` corrigido — campos errados
`args`→`params`, `returnType`→`return:{objectType,type}`, `inputRef`→`params[graphqlInput]`.
Sem esta correcção o engine recebia um config inválido e não gerava código silenciosamente.  
**Input:** objecto manifest do formulário  
**Output:** chamada IPC via preload  
**Estado:** ✅ Implementado e corrigido

---

### [PRELOAD] Passo 4 — Bridge `window.graphql`
**Ficheiro:** `src/preload/index.ts` + `src/preload/index.d.ts`  
**O que faz:** Expõe `window.graphql.create`, `window.graphql.update`,
`window.graphql.delete`, `window.graphql.list` como `ipcRenderer.invoke(...)`.  
**Input:** manifest serializado  
**Output:** IPC invoke para o handler GraphQL no Main  
**Estado:** ✅ Implementado

---

### [MAIN] Passo 5 — IPC Handler GraphQL
**Ficheiro:** `src/main/handlers/graphql/graphql-manifest.handler.ts`  
**O que faz:** Recebe o invoke do preload e chama `GraphqlManifestService`.  
**Input:** IPC event + manifest  
**Output:** chamada ao service de persistência  
**Estado:** ✅ Implementado

---

### [MAIN] Passo 6 — Persistência em disco
**Ficheiro:** `src/main/services/graphql/graphql-manifest.service.ts`  
**O que faz:** Escreve e lê o manifest em `.igrpstudio/<module>/graphql/graphql.json`.
Usa escrita atómica (temp file + rename). Cria manifest vazio se não existir.
Este ficheiro é a **source of truth** para geração futura.  
**Input:** manifest + module path  
**Output:** `graphql.json` em disco  
**Estado:** ✅ Implementado

---

### [STUDIO — Phase 4] Passo 7 — Trigger save → generate
**Ficheiro:** `src/renderer/src/generators/api/pages/graphql/service.ts` (`generateSchemas`)  
**O que faz:** Após save do manifest, agrupa operações por `returnType` não-primitivo
e chama `window.engine.createGraphqlSchema(config, 'springboot', basePath)` para cada tipo.  
**Estado:** ✅ Implementado

---

### [PRELOAD] Passo 8 — Bridge `window.engine.createGraphqlSchema`
**Ficheiro:** `src/preload/index.ts`  
**O que faz:** Expõe `window.engine.createGraphqlSchema(schemaConfig, engineType, basePath)`
como `ipcRenderer.invoke(EVENTS.SPRING.CREATE_GRAPHQL_SCHEMA, ...)`.  
**Estado:** ✅ Implementado

---

### [MAIN] Passo 9 — IPC Handler engine GraphQL
**Ficheiro:** `src/main/handlers/api-handler.ts`  
**O que faz:** Recebe `spring-engine:create-graphql-schema`, obtém engine via
`EngineFactory.getEngine(engineType)` e chama `engine.createGraphqlSchema(config, basePath)`.  
**Estado:** ✅ Implementado

---

### [MAIN] Passo 10 — `SpringEngine.createGraphqlSchema`
**Ficheiro:** `src/main/engines/SpringEngine.ts`  
**O que faz:** Delega em `addGraphQLSchema(config, basePath)` do package
`@igrp/igrp-studio-springboot-engine@0.1.0-beta.20-snapshot.3`.  
**Estado:** ✅ Implementado

---

### [ENGINE] Passo 11 — Geração de artefactos Java + SDL
**Package:** `@igrp/igrp-studio-springboot-engine`  
**O que gera dado um `GraphQLSchemaConfig` válido:**
- `graphql/<type>/I<Type>GraphQLService.java` — interface do serviço
- `graphql/<type>/<Type>GraphQLService.java` — implementação (gerada uma vez)
- `graphql/<type>/<Type>Resolver.java` — controller com `@QueryMapping`/`@MutationMapping`
- `graphql/types/<Type>.java` — POJO do tipo GraphQL
- `graphql/config/GraphQLConfig.java` — configuração de scalars e instrumentação
- `resources/graphql/<Type>.graphqls` — schema SDL

**Bugs conhecidos no engine (`0.1.0-beta.20-snapshot.3`):**
- SDL emite `string`/`id` (minúsculas) em vez de `String`/`ID` → fix manual no `.graphqls`, `IProdutoGraphQLService.java` e `ProdutoResolver.java`
- `enableCustonValidation: true` num GraphQL Type gera validator mas não gera `ProdutoDTO.java` → fix manual criando a classe
- Mesmo bug afecta Java: `string nome` e `id id` nos tipos do Resolver/Interface

**Estado:** ✅ Funcional com fixes manuais pontuais

---

### [PROJECTO SPRING] Passo 12 — Implementação do serviço
**Ficheiro:** `graphql/<type>/<Type>GraphQLService.java`  
**O que faz:** Implementa a interface gerada com lógica de negócio real.
A implementação não é sobrescrita pelo engine em gerações subsequentes.  
**Padrão seguido no `testegql`:**
- `ProdutoEntity` + `ProdutoRepository` (JPA + Spring Data)
- `verProduto(nome)` → `findAll()` ou `findByNomeContainingIgnoreCase(nome)`
- `verProdutoPorId(id)` → `findById(UUID.fromString(id))` — adicionado 2026-05-05
- `tudoProduto(input, nome)` → `save(entity)` + mapeamento para tipo GraphQL

**Estado:** ✅ Implementado e testado com persistência real em PostgreSQL

---

### [TESTADO] Passo 13 — Postman + PostgreSQL
**Request:** `POST http://localhost:8080/graphql`  
**Status:** ✅ 200 OK — cadeia completa funcional  

**Mutation testada:**
```graphql
mutation {
  tudoProduto(input: "teste", nome: "Mesa") {
    nome
  }
}
```
**Response:**
```json
{ "data": { "tudoProduto": { "nome": "Mesa" } } }
```

**Query testada:**
```graphql
{ verProduto { nome } }
```
**Response:**
```json
{ "data": { "verProduto": [{ "nome": "Mesa" }, { "nome": "Cadeira" }, ...] } }
```

**Verificação na BD:**
```sql
SELECT id, nome, created_date FROM t_produto ORDER BY created_date;
-- 4 rows: Mesa | Cadeira | Laptop | Monitor — todos com UUID e timestamp
```

**Query por ID testada (2026-05-05):**
```graphql
{ verProdutoPorId(id: "4a3b92cf-3b38-400c-9c0c-3dc7665f6362") { nome } }
```
**Response:** `{ "data": { "verProdutoPorId": { "nome": "Mesa" } } }` ✅

---

## Bugs de engine a reportar ao developer

| # | Bug | Versão | Workaround aplicado |
|---|-----|--------|---------------------|
| 1 | SDL emite `string` em vez de `String` para params `objectType: 'java'` | `0.1.0-beta.20-snapshot.3` | Fix manual no `.graphqls` gerado |
| 2 | `enableCustonValidation: true` gera validator mas não gera `ProdutoDTO.java` | `0.1.0-beta.20-snapshot.3` | Criar `ProdutoDTO.java` manualmente |
| 3 | `common.graphqls` gerado com `type Subscription` vazio — falha no arranque Spring | `0.1.0-beta.20-snapshot.3` | Remover `type Subscription` manualmente |

---

## TO-DO — Gaps ainda em aberto

| # | O que fazer | Onde | Critério de feito |
|---|-------------|------|-------------------|
| 1 | Reportar bugs de SDL ao developer do engine | — | Bugs confirmados e documentados acima |
| 2 | Corrigir scalar mapping no engine (SDL + Java) | `@igrp/igrp-studio-springboot-engine` | `string`→`String`, `id`→`ID`/`String` em SDL e tipos Java |
| 3 | Corrigir geração de `ProdutoDTO.java` quando `enableCustonValidation: true` | `@igrp/igrp-studio-springboot-engine` | DTO gerado com os campos correctos |
| 4 | Corrigir `type Subscription` vazio no `common.graphqls` | `@igrp/igrp-studio-springboot-engine` | Não emitir `type Subscription` se não há subscriptions |
| 5 | Erros do engine silenciados em `generateSchemas` | `service.ts` | Log ou notificação UI quando `createGraphqlSchema` falha |
| 6 | Geração para operações com `returnType` primitivo | `service.ts:generateSchemas` | Mutations que retornam `Boolean`/`String` também geram código |
| 7 | Teste com módulo que tem Queries + Mutations + tipos complexos | projecto Spring | Cadeia completa sem touches manuais |
| 8 | Phase 6 — Improvements | — | Fora de âmbito por agora |

---

## Regras que nunca podem ser quebradas nesta implementação

1. `window.graphql` é **apenas** para CRUD do manifest — nunca para geração.
2. `window.engine` é **o** canal de geração — qualquer GraphQL generator passa por aqui.
3. O manifest em `.igrpstudio/<module>/graphql/graphql.json` é a source of truth — o generator lê dali, nunca do estado do UI.
4. Query / Mutation / Subscription têm campos mutuamente exclusivos — nunca misturar `inputType` em queries ou `eventTopic` em mutations.
5. Escrita atómica — manifest inválido nunca deve ser parcialmente escrito.
6. GraphQL é extensão do API Designer — não cria arquitectura paralela.
