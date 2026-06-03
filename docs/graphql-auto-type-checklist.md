# Checklist de execução — GraphQL Type auto-derivado

> Plano completo: [graphql-auto-type-plan.md](graphql-auto-type-plan.md)
> Este ficheiro é o passo-a-passo direto para codar.

---

## Objetivo numa linha

Quando o user grava uma operation GraphQL com `returnType: 'X'`, o Studio clona o DTO `X` em memória com `type: 'graphqlType'` e chama `window.engine.createDto(...)` antes de gerar o schema. O engine roteia o clone para `graphql/types/X.json` e gera o Java.

---

## Pré-requisitos (3 correcções antes da feature)

Resultado da revisão do plano. Resolver **antes** de começar a feature, sob pena de a feature partir em casos legítimos hoje aceites pela UI.

### P1. Restringir o dropdown de `returnType`/`inputType` a DTOs

**Problema:** [useGraphQLOperation.ts:157-177](../src/renderer/src/generators/api/pages/graphql/useGraphQLOperation.ts#L157-L177) constrói `sharedTypeOptions` a partir de `[...dto, ...models, ...responses, ...enums]`. O `ensureTypeManifest` só procura em `dtoList`. Se o user escolher um Model/Response/Enum, o save falha com *"no DTO source found"* — selecção legítima, falha não óbvia.

**Decisão:** restringir o dropdown a DTOs em V1. O `inputType` de mutations já é semanticamente um Input Object (DTO), portanto também só DTOs.

**Mudança:** split do `sharedTypeOptions` em dois `useMemo` distintos:
- `returnTypeOptions` — DTOs do módulo + escalares GraphQL (`ID`, `String`, `Int`, `Float`, `Boolean`)
- `inputTypeOptions` — DTOs do módulo apenas (sem escalares; input nunca é primitivo isolado)

Devolver ambos no `return` do hook. Os dois consumidores no formulário continuam a usar `returnTypeOptions` e `inputTypeOptions` (o nome já existia, só vão deixar de apontar ao mesmo array).

**Trade-off:** se algum `graphql.json` existente tiver `returnType` que não seja DTO (Model/Response/Enum), ao reabrir essa operation o dropdown não terá a opção pré-seleccionada. Como Phases 1-3 são recentes, é aceitável. Verificar com `grep` no projeto teste antes de fechar o trabalho.

### P2. Skip do schema gen quando não restam ops com aquele `returnType`

**Problema:** ao apagar a última operation com `returnType=X`, `persistSchemaToEngine` corre na mesma — `ensureTypeManifest` re-grava o type, e `buildSchemaConfig` produz `{queries:[], mutations:[]}`. O engine valida config via `Kl(r)` (Ajv-style) em [addGraphQLSchema](../node_modules/@igrp/igrp-studio-springboot-engine/dist/index.es.js#L34037); comportamento perante arrays vazios desconhecido e fora do escopo desta feature.

**Decisão:** early-return em `persistSchemaToEngine` quando `schemaOps` está vazio. Type manifest e `.graphqls` ficam órfãos — alinhado com o defer de cleanup em §8.2 do plano.

**Mudança:** no `persistSchemaToEngine`, logo a seguir ao filter `schemaOps`, adicionar:
```ts
if (schemaOps.length === 0) {
    // Última operation deste returnType acabou de ser apagada.
    // Type manifest e .graphqls ficam órfãos — cleanup é Phase 6.
    return
}
```

### P3. Não copiar o `id` do DTO original no clone

**Problema:** `{...source.content, type:'graphqlType', module}` mantém o `id` do DTO original. Code smell — duas entidades distintas (`dto/X.json` e `graphql/types/X.json`) com o mesmo `id`.

**Validação no engine:** [saveDTOConfig](../node_modules/@igrp/igrp-studio-springboot-engine/dist/index.es.js#L3776) escreve o JSON via `JSON.stringify(e, null, 2)` (linha 3783) e passa `e.id` ao writer `ge` apenas para detectar renomes de ficheiros pré-existentes ([index.es.js:3708](../node_modules/@igrp/igrp-studio-springboot-engine/dist/index.es.js#L3708)). Não há ramo dessa lógica para `CONFIG_GRAPHQL_TYPES`, portanto `id: undefined` é seguro — `JSON.stringify` omite o campo.

**Decisão:** `id: undefined` no clone, em ambos os helpers.

**Mudança:** ver snippets `ensureTypeManifest` e `ensureInputManifest` mais abaixo (já incorporam `id: undefined`).

---

## Ficheiros a alterar

### 1. [src/renderer/src/generators/api/pages/graphql/service.ts](../src/renderer/src/generators/api/pages/graphql/service.ts)

**Por quê:** é onde já chamamos o engine para gerar o schema. Adicionar 2 helpers que garantem que os manifests `graphqlType`/`graphqlInput` existem antes de o schema ser gerado.

**Mudanças:**

| Onde | O quê | Por quê |
|---|---|---|
| topo do ficheiro | adicionar `ensureTypeManifest(basePath, moduleName, typeName, dtoList)` | clona DTO source com `type:'graphqlType'`, chama `window.engine.createDto` |
| topo do ficheiro | adicionar `ensureInputManifest(basePath, moduleName, inputName, dtoList)` | idem com `type:'graphqlInput'` para mutations |
| `persistSchemaToEngine` | aceitar novo param `dtoList`; chamar `ensureTypeManifest` antes de `createGraphqlSchema`; iterar mutations chamando `ensureInputManifest` | ordem correta: tipo existe → schema gera |
| `GraphQLService.createGraphQLOperation` | aceitar `dtoList` e passá-lo a `persistSchemaToEngine` | propagar o array de DTOs vindo do hook |
| `GraphQLService.updateGraphQLOperation` | idem | idem |
| `GraphQLService.deleteGraphQLOperation` | idem | idem (regenera schema sem a operation apagada) |
| linha por linha | remover `console.log('[graphql] ...')` | cleanup da sessão de debug |

### 2. [src/renderer/src/generators/api/pages/graphql/useGraphQLOperation.ts](../src/renderer/src/generators/api/pages/graphql/useGraphQLOperation.ts)

**Por quê:** é o hook que chama o `GraphQLService`. Já tem `dto` em escopo via `useStudioAPI`. Falta passar nas 3 chamadas.

**Mudanças:**

| Linha aprox. | O quê | Por quê |
|---|---|---|
| 91 | confirmar que `dto` já vem desestruturado de `useStudioAPI(currentItem?.module)` | é o array de DTOs do módulo |
| 120-126 | `createGraphQLOperation(... , values, dto)` e `updateGraphQLOperation(... , values, dto)` | passar lista de DTOs para o service usar como source de clonagem |
| 146 | `deleteGraphQLOperation(... , savedOperation.id, dto)` | mesma razão |
| 157-177 | substituir `sharedTypeOptions` por dois `useMemo`: `returnTypeOptions` (DTOs + escalares) e `inputTypeOptions` (apenas DTOs) | P1 — fechar a porta a selecções não-DTO que partem o save |
| return do hook | devolver `returnTypeOptions` e `inputTypeOptions` separados | consumidores no form já usam estes nomes; só passam a apontar a arrays distintos |

### 3. [src/main/handlers/api-handler.ts:65-77](../src/main/handlers/api-handler.ts#L65-L77)

**Por quê:** debug logs e try/catch verboso adicionados na sessão anterior; o handler dos outros artefactos é simples.

**Mudança:** voltar ao formato 1-line do `EVENTS.SPRING.CREATE_DTO` (linhas 56-62) — sem `console.log`, sem try/catch explícito (`handleWithCustomErrors` já trata).

### 4. [src/main/engines/SpringEngine.ts:55-64](../src/main/engines/SpringEngine.ts#L55-L64)

**Por quê:** mesma razão — debug verboso na sessão anterior.

**Mudança:** voltar ao formato simples como `createDto`/`createModel`:
```ts
async createGraphqlSchema(config: GraphQLSchemaConfig, basePath: string): Promise<void> {
    await addGraphQLSchema(config, basePath)
}
```

### 5. (opcional) Projeto teste — `.igrpstudio/venda/graphql/types/Docc.json`

**Por quê:** validar que o sistema recria o ficheiro automaticamente.

**Mudança:** apagar à mão antes de testar.

---

## Ordem de execução

### Fase 0 — Cleanup da sessão anterior (commit isolado)

Sair do estado actual com baseline limpo antes de tocar na feature. Diff fica claro.

1. [ ] Remover `console.log('[graphql] ...')` em `service.ts`
2. [ ] Reverter `api-handler.ts:65-77` ao formato 1-line do `EVENTS.SPRING.CREATE_DTO` (sem try/catch verboso, sem logs)
3. [ ] Reverter `SpringEngine.ts:55-64` ao formato simples (`await addGraphQLSchema(config, basePath)`)
4. [ ] Type-check
5. [ ] Commit `chore: remove graphql debug logs`

### Fase 1 — Pré-requisitos da feature (P1, P2, P3 — podem ir no mesmo commit que a feature)

6. [ ] **P1** — `useGraphQLOperation.ts` L157-177: split de `sharedTypeOptions` em `returnTypeOptions` (DTOs + escalares) e `inputTypeOptions` (apenas DTOs); actualizar `return` do hook
7. [ ] Validar manualmente que o Operation form continua a renderizar e os dois `<Select>` apontam aos arrays correctos
8. [ ] **P3** — pronto nos snippets (`id: undefined` no clone) — confirmar ao colar
9. [ ] **P2** — pronto no snippet de `persistSchemaToEngine` (early-return em `schemaOps.length === 0`) — confirmar ao colar

### Fase 2 — Feature (auto-derivação de graphqlType/graphqlInput)

10. [ ] `service.ts` — adicionar `ensureTypeManifest` + `ensureInputManifest` (com `id: undefined`)
11. [ ] `service.ts` — atualizar `persistSchemaToEngine` para aceitar `dtoList`, chamar os helpers e ter early-return
12. [ ] `service.ts` — atualizar `createGraphQLOperation`, `updateGraphQLOperation`, `deleteGraphQLOperation` para receber `dtoList`
13. [ ] `useGraphQLOperation.ts` — passar `dto` nas 3 chamadas (linhas ~120, ~123, ~146)
14. [ ] Type-check (`yarn typecheck` ou equivalente) — garantir que assinaturas batem

### Fase 3 — Validação E2E

15. [ ] Apagar `Docc.json` manual no projeto teste (`.igrpstudio/venda/graphql/types/Docc.json`)
16. [ ] Verificar `grep` em `graphql.json` existentes: nenhuma operation com `returnType` que não seja DTO
17. [ ] Teste E2E #1: criar Query `duc` retornando `Docc` num módulo onde `Docc` é DTO
18. [ ] Teste E2E #2: editar o DTO `Docc` (add atributo) e re-gravar a Query — clone reflete a mudança
19. [ ] Teste E2E #3: criar Mutation com `inputType` apontando para um DTO existente
20. [ ] Teste E2E #4 (P1): abrir o dropdown de Return Type — só vê DTOs + escalares; abrir Input Type — só vê DTOs
21. [ ] Teste E2E #5 (P2): apagar a última Query com `returnType=Docc` — sem erro, sem chamada ao engine
22. [ ] Teste E2E #6 (P3): inspeccionar `graphql/types/Docc.json` — não tem o mesmo `id` do `dto/Docc.json`
23. [ ] Type-check + commit `feat(graphql): auto-derive graphqlType/graphqlInput manifests`

---

## Snippets prontos a colar

### `ensureTypeManifest` (service.ts)

```ts
async function ensureTypeManifest(
    basePath: string,
    moduleName: string,
    typeName: string,
    dtoList: any[]
): Promise<void> {
    if (PRIMITIVES.has(typeName)) return

    const source = dtoList.find(item => (item.content?.name ?? item.name) === typeName)
    if (!source?.content) {
        throw new Error(`Cannot derive GraphQL type '${typeName}': no DTO source found in module '${moduleName}'`)
    }

    const clone = {
        ...source.content,
        id: undefined,                  // P3 — evita colisão de id com o DTO original
        type: 'graphqlType',
        module: moduleName
    }
    const result = await window.engine.createDto(clone, ENV_TYPES.SPRING, basePath)
    if (result?.error) {
        throw new Error(`Failed to persist graphqlType '${typeName}': ${result.error}`)
    }
}
```

### `ensureInputManifest` (service.ts)

```ts
async function ensureInputManifest(
    basePath: string,
    moduleName: string,
    inputName: string,
    dtoList: any[]
): Promise<void> {
    const source = dtoList.find(item => (item.content?.name ?? item.name) === inputName)
    if (!source?.content) {
        throw new Error(`Cannot derive GraphQL input '${inputName}': no DTO source found in module '${moduleName}'`)
    }

    const clone = {
        ...source.content,
        id: undefined,                  // P3 — evita colisão de id com o DTO original
        type: 'graphqlInput',
        module: moduleName
    }
    const result = await window.engine.createDto(clone, ENV_TYPES.SPRING, basePath)
    if (result?.error) {
        throw new Error(`Failed to persist graphqlInput '${inputName}': ${result.error}`)
    }
}
```

### `persistSchemaToEngine` revisto (service.ts)

```ts
async function persistSchemaToEngine(
    basePath: string,
    moduleName: string,
    schemaName: string,
    dtoList: any[]
): Promise<void> {
    if (PRIMITIVES.has(schemaName)) return

    const allOps = await window.graphql.listGraphQLOperations(basePath, moduleName)
    const schemaOps = allOps.filter(op => op.returnType === schemaName)

    if (schemaOps.length === 0) {
        // P2 — Última operation deste returnType acabou de ser apagada.
        // Type manifest e .graphqls ficam órfãos — cleanup é Phase 6.
        return
    }

    await ensureTypeManifest(basePath, moduleName, schemaName, dtoList)

    const inputNames = new Set(
        schemaOps
            .filter(op => op.operationType === 'mutation' && op.inputType)
            .map(op => op.inputType as string)
    )
    for (const inputName of inputNames) {
        await ensureInputManifest(basePath, moduleName, inputName, dtoList)
    }

    const config = buildSchemaConfig(moduleName, schemaName, schemaOps)
    const result = await window.engine.createGraphqlSchema(config, ENV_TYPES.SPRING, basePath)
    if (result?.error) {
        throw new Error(`createGraphqlSchema failed: ${result.error}`)
    }
}
```

### Métodos públicos revistos (service.ts)

```ts
export const GraphQLService = {
    async createGraphQLOperation(basePath, moduleName, values, dtoList) {
        const payload = toGraphQLOperationPayload({ ...values, id: undefined })
        const result = await window.graphql.createGraphQLOperation(basePath, moduleName, payload)
        if (payload.operationType !== 'subscription') {
            await persistSchemaToEngine(basePath, moduleName, payload.returnType, dtoList)
        }
        return result
    },

    async updateGraphQLOperation(basePath, moduleName, operationId, values, dtoList) {
        const payload = toGraphQLOperationPayload({ ...values, id: operationId })
        const result = await window.graphql.updateGraphQLOperation(basePath, moduleName, operationId, payload)
        if (payload.operationType !== 'subscription') {
            await persistSchemaToEngine(basePath, moduleName, payload.returnType, dtoList)
        }
        return result
    },

    async deleteGraphQLOperation(basePath, moduleName, operationId, dtoList) {
        const allOps = await window.graphql.listGraphQLOperations(basePath, moduleName)
        const target = allOps.find(op => op.id === operationId)
        await window.graphql.deleteGraphQLOperation(basePath, moduleName, operationId)
        if (target && target.operationType !== 'subscription') {
            await persistSchemaToEngine(basePath, moduleName, target.returnType, dtoList)
        }
    },

    async listGraphQLOperations(basePath, moduleName) {
        return await window.graphql.listGraphQLOperations(basePath, moduleName)
    }
}
```

### Hook (useGraphQLOperation.ts)

```ts
// L120-126
const result = savedOperation?.id
    ? await GraphQLService.updateGraphQLOperation(
          basePath, currentItem.module, savedOperation.id, values, dto
      )
    : await GraphQLService.createGraphQLOperation(basePath, currentItem.module, values, dto)

// L146
await GraphQLService.deleteGraphQLOperation(basePath, currentItem.module, savedOperation.id, dto)
```

### Split de dropdowns no hook — P1 (useGraphQLOperation.ts L157-177)

Substituir o `sharedTypeOptions` único por dois `useMemo`:

```ts
const returnTypeOptions = useMemo(() => {
    const artifactOptions = dto.map((item: any) => ({
        label: item.content?.name || item.name,
        value: item.content?.name || item.name
    }))
    const scalarOptions = [
        { label: 'ID', value: 'ID' },
        { label: 'String', value: 'String' },
        { label: 'Int', value: 'Int' },
        { label: 'Float', value: 'Float' },
        { label: 'Boolean', value: 'Boolean' }
    ]
    const unique = new Map<string, { label: string; value: string }>()
    ;[...scalarOptions, ...artifactOptions].forEach(o => unique.set(o.value, o))
    return Array.from(unique.values())
}, [dto])

const inputTypeOptions = useMemo(() => {
    return dto.map((item: any) => ({
        label: item.content?.name || item.name,
        value: item.content?.name || item.name
    }))
}, [dto])
```

E no `return` do hook devolver os dois separadamente (substituir as duas linhas que apontavam ambas a `sharedTypeOptions`):

```ts
return {
    // ...resto inalterado...
    returnTypeOptions,
    inputTypeOptions
}
```

### Handler limpo (api-handler.ts)

```ts
handleWithCustomErrors(
    EVENTS.SPRING.CREATE_GRAPHQL_SCHEMA,
    async (_event, schemaConfig: any, engineType: string, basePath: string) => {
        const engine = EngineFactory.getEngine(engineType)
        await engine.createGraphqlSchema?.(schemaConfig, basePath)
    }
)
```

### Engine limpo (SpringEngine.ts)

```ts
async createGraphqlSchema(config: GraphQLSchemaConfig, basePath: string): Promise<void> {
    await addGraphQLSchema(config, basePath)
}
```

---

## Smoke test (após implementar)

Num projeto com módulo `venda` e DTO `Docc` em `dto/`:

```
1. Apagar (se existir) .igrpstudio/venda/graphql/types/Docc.json
2. Studio → módulo venda → GraphQL → Queries → criar "duc"
3. Return Type = Docc, Return Mode = List, Save
4. Verificar:
   ✓ .igrpstudio/venda/graphql/types/Docc.json apareceu sozinho
   ✓ src/main/java/.../venda/graphql/type/Docc.java apareceu
   ✓ src/main/resources/graphql/venda/Docc.graphqls apareceu
   ✓ DucResolver.java apareceu
   ✓ Toast de sucesso, sem erros no DevTools
```

### Critérios de aceitação adicionais (P1/P2/P3)

- **P1a** O dropdown de Return Type lista apenas DTOs do módulo + escalares. Models/Responses/Enums não aparecem.
- **P1b** O dropdown de Input Type (mutations) lista apenas DTOs (sem escalares).
- **P2** Apagar a última Query com `returnType=Docc` não atira erro nem chama o engine para gerar schema. `graphql.json` é actualizado, ficheiros Java/`.graphqls` ficam (cleanup é defer).
- **P3** O `.igrpstudio/<module>/graphql/types/X.json` gerado **não** contém o mesmo `id` do `.igrpstudio/<module>/dto/X.json` — campo `id` está ausente ou diferente.

---

## Notas finais

- **Não tocar** em `pages/dto/`, sidebar, IPC, preload, ou no engine
- **Não criar** ficheiros novos
- **Não mexer** em `graphql-manifest.service.ts` (Main) — continua a ser CRUD do `graphql.json` e nada mais
- Se algum teste E2E falhar, **diagnosticar com logs temporários** mas não fazer commit deles
