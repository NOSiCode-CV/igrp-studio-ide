# Plano — Auto-derivação de GraphQL Types a partir de DTOs

> **Estado:** rascunho para revisão antes de implementar
> **Escopo:** eliminar o passo manual de criar `.igrpstudio/<module>/graphql/types/<Name>.json` quando se grava uma operation GraphQL
> **Princípio guia:** reutilizar a interface `DTOConfig` do engine com `type: 'graphqlType'` — não criar nova interface, não criar novo IPC, não criar nova UI

---

## 1. Contexto

### 1.1 O que já está integrado no repo

- Phases 1–3 da feature GraphQL (manifest CRUD, UI mapping, validation) — implementadas
- `window.graphql.*` grava `.igrpstudio/<module>/graphql/graphql.json` (operations source-of-truth)
- `window.engine.createGraphqlSchema(...)` (sessão anterior) chama `addGraphQLSchema` do engine que gera `.graphqls`, resolvers, services, datafetchers em Java

### 1.2 O bloqueio observado em runtime

Ao gravar uma Query com `returnType: 'Docc'`, o engine falha com:
```
GraphQL type manifest not found for 'Docc'
```

Causa: `addGraphQLSchema` exige que `.igrpstudio/<module>/graphql/types/Docc.json` exista para resolver o tipo de retorno. Esse ficheiro não é criado por nenhum fluxo automático do Studio.

### 1.3 Workaround manual usado para validar

Foi criado à mão `.igrpstudio/venda/graphql/types/Docc.json`:

```json
{
  "type": "graphqlType",
  "name": "Docc",
  "module": "venda",
  "attributes": [{ "name": "id", "type": "Long", "nullable": false }]
}
```

Após este ficheiro existir, o engine concluiu a geração Java com sucesso. **Confirma que a única peça em falta é a criação automática deste manifest.**

---

## 2. Descoberta-chave do engine

### 2.1 `addDTO` já roteia por `type` field

[node_modules/@igrp/igrp-studio-springboot-engine/dist/modules/dto/saveDTOConfig.d.ts](../node_modules/@igrp/igrp-studio-springboot-engine/dist/modules/dto/saveDTOConfig.d.ts):

> `saveDTOConfig` — Generates and saves the configuration file of a DTO.
> **graphqlType/graphqlInput manifests go to `.igrpstudio/<module>/graphql/types/`**
> All other DTO types go to `.igrpstudio/<module>/dto/`

[node_modules/@igrp/igrp-studio-springboot-engine/dist/index.d.ts:224](../node_modules/@igrp/igrp-studio-springboot-engine/dist/index.d.ts#L224):
```
addDTO: (dirty: DTOConfig | HandlerConfig, basePath: string) => Promise<void>
```

[node_modules/@igrp/igrp-studio-springboot-engine/dist/utils/constants.d.ts:452](../node_modules/@igrp/igrp-studio-springboot-engine/dist/utils/constants.d.ts#L452):
```
OBJECT_TYPES = ["dto", "command", "query", "event", "filter", "response", "graphqlType", "graphqlInput"]
```

### 2.2 Tradução prática

Um GraphQL Type **é literalmente um DTOConfig com `type: 'graphqlType'`**. O engine:
- aceita o config via `addDTO`
- escreve o JSON em `graphql/types/`
- gera a classe Java correspondente no package `graphqlType`
- mantém namespace separado de DTOs normais (sem colisão de nomes)

A frase do tutor *"adicionar mais uma interface DTO onde resolve este problema"* refere-se exatamente a isto: **a interface já existe, basta usá-la com o `type` correto**.

### 2.3 Comparação de formato

| Campo | Workaround manual | DTOConfig (formato canónico) | Origem |
|---|---|---|---|
| `type` | `"graphqlType"` | `"graphqlType"` | igual |
| `name` | `"Docc"` | `"Docc"` | igual |
| `module` | `"venda"` | `"venda"` | igual |
| `template` | ausente | `"classic"` | obrigatório no DTOConfig |
| `attributes[].objectType` | ausente | `"java"` ou `"graphqlType"` | obrigatório no JavaAttribute |
| `attributes[].required` | usa `nullable:false` | `true/false` | obrigatório |
| `attributes[].primaryKey` | ausente | `true/false` | recomendado |
| `attributes[].type` | `"Long"` (PascalCase) | `"uuid"` (lowercase) | engine espera lowercase |

O workaround funcionou por sorte (1 atributo simples). Para tipos reais o formato canónico é obrigatório — e é exatamente o que um DTO normal já produz.

---

## 3. Solução proposta

### 3.1 Núcleo da ideia

**Quando o user grava uma operation GraphQL com `returnType: 'X'` (não-primitivo):**
1. O Studio já tem em memória o `DTOConfig` de `X` (carregado via `useStudioAPI`)
2. Cria-se um **clone em memória** com `type: 'graphqlType'`
3. Chama-se `window.engine.createDto(clone, 'springboot', basePath)` — o engine roteia para `graphql/types/X.json` e gera o Java
4. Só então se chama `window.engine.createGraphqlSchema(...)` (já existente)

Para mutations com `inputType: 'Y'`, idem com `type: 'graphqlInput'`.

### 3.2 Fluxo de dados

```
[ User gravar Query duc, returnType=Docc ]
            |
            v
useGraphQLOperation.onSubmit
            |
            v
GraphQLService.createGraphQLOperation(basePath, module, values, dto[])
            |
            +---> window.graphql.createGraphQLOperation       // grava graphql.json (já existe)
            |
            +---> persistSchemaToEngine(...)
                       |
                       +---> ensureTypeManifest("Docc", dto[])
                       |          |
                       |          +---> source = dto.find(d => d.name === "Docc")
                       |          +---> clone = { ...source, type: 'graphqlType', module }
                       |          +---> window.engine.createDto(clone, 'springboot', basePath)
                       |                     |
                       |                     v
                       |          [ engine grava graphql/types/Docc.json + Docc.java ]
                       |
                       +---> ensureInputManifest(...) // se for mutation com inputType
                       |
                       +---> window.engine.createGraphqlSchema(schemaConfig, ...)
                                  |
                                  v
                       [ engine gera .graphqls + resolver + service ]
```

### 3.3 Por que esta abordagem

| Critério | Score |
|---|---|
| Ficheiros tocados | 2 |
| Linhas líquidas | ~33 |
| Mudanças de UI | 0 |
| Novos IPC channels | 0 |
| Novos handlers Main | 0 |
| Novos tipos / interfaces | 0 |
| User precisa aprender algo novo | Não |
| Re-uso de DTO existente | Sim, literal (clone com type field trocado) |
| Idempotente (re-saves não corrompem) | Sim — engine faz overwrite |

---

## 4. Ficheiros a modificar

### 4.1 [src/renderer/src/generators/api/pages/graphql/service.ts](../src/renderer/src/generators/api/pages/graphql/service.ts) — mudança principal

**Adicionar duas helper functions:**

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
        throw new Error(`Cannot derive GraphQL type '${typeName}': no DTO source found`)
    }

    const clone = { ...source.content, type: 'graphqlType', module: moduleName }
    const result = await window.engine.createDto(clone, ENV_TYPES.SPRING, basePath)
    if (result?.error) throw new Error(`Failed to persist graphqlType '${typeName}': ${result.error}`)
}

async function ensureInputManifest(
    basePath: string,
    moduleName: string,
    inputName: string,
    dtoList: any[]
): Promise<void> {
    const source = dtoList.find(item => (item.content?.name ?? item.name) === inputName)
    if (!source?.content) {
        throw new Error(`Cannot derive GraphQL input '${inputName}': no DTO source found`)
    }

    const clone = { ...source.content, type: 'graphqlInput', module: moduleName }
    const result = await window.engine.createDto(clone, ENV_TYPES.SPRING, basePath)
    if (result?.error) throw new Error(`Failed to persist graphqlInput '${inputName}': ${result.error}`)
}
```

**Atualizar `persistSchemaToEngine`:**

```ts
async function persistSchemaToEngine(
    basePath: string,
    moduleName: string,
    schemaName: string,
    dtoList: any[]                                       // novo parâmetro
): Promise<void> {
    if (PRIMITIVES.has(schemaName)) return

    const allOps = await window.graphql.listGraphQLOperations(basePath, moduleName)
    const schemaOps = allOps.filter(op => op.returnType === schemaName)

    // 1. Garantir return type manifest
    await ensureTypeManifest(basePath, moduleName, schemaName, dtoList)

    // 2. Garantir input manifests para todas as mutations deste schema
    const inputNames = new Set(
        schemaOps
            .filter(op => op.operationType === 'mutation' && op.inputType)
            .map(op => op.inputType as string)
    )
    for (const inputName of inputNames) {
        await ensureInputManifest(basePath, moduleName, inputName, dtoList)
    }

    // 3. Gerar schema (.graphqls, resolver, service)
    const config = buildSchemaConfig(moduleName, schemaName, schemaOps)
    const result = await window.engine.createGraphqlSchema(config, ENV_TYPES.SPRING, basePath)
    if (result?.error) throw new Error(`createGraphqlSchema failed: ${result.error}`)
}
```

**Atualizar a assinatura pública do `GraphQLService`:**

Cada método que persistia o schema passa a receber `dtoList`:
```ts
createGraphQLOperation(basePath, moduleName, values, dtoList)
updateGraphQLOperation(basePath, moduleName, operationId, values, dtoList)
deleteGraphQLOperation(basePath, moduleName, operationId, dtoList)
```

### 4.2 [src/renderer/src/generators/api/pages/graphql/useGraphQLOperation.ts](../src/renderer/src/generators/api/pages/graphql/useGraphQLOperation.ts#L91) — passar a lista de DTOs

Linha 91 já chama `useStudioAPI(currentItem?.module)` e desestrutura `dto`. Basta passá-lo às chamadas do service:

```ts
// L120-126 (create/update)
const result = savedOperation?.id
    ? await GraphQLService.updateGraphQLOperation(
          basePath, currentItem.module, savedOperation.id, values, dto
      )
    : await GraphQLService.createGraphQLOperation(
          basePath, currentItem.module, values, dto
      )

// L146 (delete)
await GraphQLService.deleteGraphQLOperation(basePath, currentItem.module, savedOperation.id, dto)
```

### 4.3 Limpeza pendente da sessão anterior (após validação E2E)

- [src/renderer/src/generators/api/pages/graphql/service.ts](../src/renderer/src/generators/api/pages/graphql/service.ts) — remover `console.log` de debug
- [src/main/handlers/api-handler.ts:65-77](../src/main/handlers/api-handler.ts#L65-L77) — voltar ao formato simples sem try/catch verboso e sem logs
- [src/main/engines/SpringEngine.ts:55-64](../src/main/engines/SpringEngine.ts#L55-L64) — voltar ao formato simples
- Apagar `.igrpstudio/venda/graphql/types/Docc.json` no projeto teste para confirmar que é recriado automaticamente

---

## 5. O que NÃO muda

Para evitar regressões e manter o escopo curto:

- **Engine `@igrp/igrp-studio-springboot-engine`** — zero alterações
- **Manifest `graphql.json` (operations CRUD)** — continua via `window.graphql.*`
- **Contract editor (`pages/dto/`)** — continua a criar DTOs normais; nenhum toggle "Kind" novo
- **Sidebar tree** — não há novo nó visível para "GraphQL Types"; o user continua a ver `Contract(N)` na sidebar e os tipos derivados existem em `graphql/types/` mas não na árvore (defer para fase posterior)
- **Operation editor dropdowns** — `returnType` e `inputType` continuam a listar DTOs como hoje (já é o que se quer)
- **Validation** — não muda
- **IPC channels e handlers** — `EVENTS.SPRING.CREATE_DTO` e `EVENTS.SPRING.CREATE_GRAPHQL_SCHEMA` já existem e são suficientes

---

## 6. Cenário end-to-end esperado (dry-run)

**Pré-condição:** projeto `courseapi`, módulo `venda` já tem um DTO `Docc` criado via Contract editor (`.igrpstudio/venda/dto/Docc.json` existe com formato DTOConfig completo).

**Passos do user:**
1. Abre operation editor para Query
2. Preenche: Name=`duc`, Return Type=`Docc` (dropdown lista DTOs como hoje), Return Mode=`List`
3. Click Save

**O que acontece nos bastidores (sem intervenção manual):**
1. Validação passa
2. `GraphQLService.createGraphQLOperation` é chamado com `dto[]`
3. `window.graphql.createGraphQLOperation` grava `graphql.json` com a operation
4. `persistSchemaToEngine` corre:
   - `ensureTypeManifest("Docc", dto[])` → encontra `dto/Docc.json` em memória → clona com `type:'graphqlType'` → `window.engine.createDto(...)` → engine grava `graphql/types/Docc.json` + `Docc.java` (graphqlType package)
   - `window.engine.createGraphqlSchema(...)` → engine encontra `graphql/types/Docc.json` → gera `Docc.graphqls`, `DoccResolver.java`, `DoccService.java`, `DoccServiceInterface.java`
5. Toast de sucesso

**Resultado no filesystem:**
```
.igrpstudio/venda/
├── dto/
│   └── Docc.json                       (DTOConfig original, type:'dto')
├── graphql/
│   ├── graphql.json                    (com operation 'duc')
│   └── types/
│       └── Docc.json                   (clone com type:'graphqlType', criado automaticamente)
└── module.json

src/main/java/.../venda/
├── dto/
│   └── Docc.java                       (DTO normal, package dto)
└── graphql/
    ├── type/
    │   └── Docc.java                   (graphqlType, package graphql.type)
    ├── DucResolver.java
    ├── DucService.java
    └── DucServiceInterface.java

src/main/resources/graphql/
└── venda/
    └── Docc.graphqls
```

---

## 7. Critérios de aceitação

Para validar a implementação:

- [ ] Apagar `graphql/types/Docc.json` à mão e gravar de novo a Query `duc` — o ficheiro reaparece automaticamente
- [ ] Criar Query `duc` com Return Type=`Docc` num projeto novo (sem `Docc.json` em `graphql/types/`) — passa sem erro, gera tudo
- [ ] Editar o DTO `Docc` (add atributo) e gravar a Query `duc` de novo — `graphql/types/Docc.json` reflete a nova estrutura
- [ ] Apagar a Query `duc` — `graphql.json` deixa de ter a operation; o `graphql/types/Docc.json` pode ficar (não é regressão; defer cleanup)
- [ ] Tentar gravar Query com Return Type=`X` onde `X` não existe como DTO no módulo — erro claro: *"Cannot derive GraphQL type 'X': no DTO source found"* (mas: o dropdown atual já não permite escolher tipos inexistentes — defensive coding)
- [ ] Criar Mutation `createDocc` com `inputType: 'DoccInput'` (assumindo DTO `DoccInput` existente) — `graphql/types/DoccInput.json` aparece com `type:'graphqlInput'` e Java é gerado
- [ ] Compilação do projeto Spring Boot gerado completa sem erros

---

## 8. Riscos e edge cases

### 8.1 Resolúveis em runtime

| Risco | Mitigação |
|---|---|
| User edita DTO depois do graphqlType ter sido clonado → graphqlType fica stale | Cada save de operation re-cria o clone (idempotente). Sem ação extra |
| DTO renomeado de `Docc` para `Document` | Operation continua a referenciar `Docc` (FK quebrada). Hoje não há check; defer cross-manifest validation (Phase 6) |
| `Docc` referenciado por múltiplas operations → `ensureTypeManifest` corre N vezes | Idempotente — engine faz overwrite. Sem custo lógico (custo I/O aceitável) |
| User apaga DTO `Docc` mas operation ainda referencia | Próximo save da operation falha com erro claro do `ensureTypeManifest`. Validation cross-manifest defer |

### 8.2 Defer (não bloqueiam V1)

- **GraphQL Types puramente "GraphQL-only"** (sem DTO source equivalente) — não suportados por esta abordagem. Se a necessidade aparecer, voltar à ideia do toggle "Kind" no Contract editor (Opção A original)
- **Sidebar não mostra GraphQL Types** — fica invisível na árvore, mas existe em disco. Phase de polish posterior
- **Cleanup de manifests órfãos** — apagar Query não apaga o `graphql/types/Docc.json` se ninguém mais usa. Defer
- **Naming collision DTO/graphqlType** — confirmado em `PACKAGE_NS` que namespaces Java são separados (`dto.Docc` vs `graphql.type.Docc`). Não há colisão. ✅
- **Atributos com referência cruzada** (`graphqlType` que tem campo do tipo `outroGraphqlType`) — picker do Contract editor não oferece `objectType: 'graphqlType'` hoje. Defer. Se aparecer, estender em [pages/dto/config.ts:81-94](../src/renderer/src/generators/api/pages/dto/config.ts#L81-L94)

---

## 9. Pontos a confirmar antes de codar

1. **`useStudioAPI().dto` devolve o `DTOConfig` completo via `item.content`?** — verificado em [src/renderer/src/hooks/use-studio-api.ts:35](../src/renderer/src/hooks/use-studio-api.ts#L35) e na função `extractByType` em [src/renderer/src/generators/api/helpers/index.ts:103-111](../src/renderer/src/generators/api/helpers/index.ts#L103-L111). Resultado: `dto[]` é `FileTree[]` onde cada item tem `content` com o JSON parsed (incluindo `attributes`). ✅
2. **`window.engine.createDto` aceita `type:'graphqlType'`?** — sim, `addDTO` aceita `DTOConfig | HandlerConfig` e `DTOConfig.type` é `ObjectTypes` que inclui `'graphqlType'`. ✅
3. **`window.engine.createDto` retorna `{result, error}` ou throw direto?** — segue o padrão `handleWithCustomErrors` em [src/main/handlers/api-handler.ts:56-62](../src/main/handlers/api-handler.ts#L56-L62) que envolve em try/catch e retorna `{result}` ou `{error}`. Logo o helper deve checar `result?.error`. ✅
4. **Module field do clone:** o DTO original tem `module: 'venda'` (ou `'shared'`). O graphqlType deve usar o módulo da operation, não o do DTO. Por isso `module: moduleName` no clone (não herdar do source). ✅

---

## 10. Ordem de implementação

1. Adicionar `ensureTypeManifest` e `ensureInputManifest` em `service.ts`
2. Atualizar `persistSchemaToEngine` para chamá-las e aceitar `dtoList`
3. Atualizar assinaturas dos métodos públicos do `GraphQLService` para receber `dtoList`
4. Atualizar `useGraphQLOperation` para passar `dto` em todas as chamadas do service
5. Limpar logs de debug em `service.ts`, `api-handler.ts`, `SpringEngine.ts`
6. Apagar `Docc.json` manual no projeto teste
7. Testar critérios de aceitação um a um
8. Commit

**Estimativa total:** 3–4h, uma única sessão.

---

## 11. Resumo executivo (1 parágrafo)

Hoje, gerar Java GraphQL exige criar manualmente um `.json` em `graphql/types/`. A solução é detetar, no momento de gravar uma operation, que tipo de retorno (e/ou input) ela usa, e clonar automaticamente o `DTOConfig` correspondente trocando o campo `type` para `'graphqlType'` (ou `'graphqlInput'`), invocando `window.engine.createDto` que já roteia o ficheiro para a pasta certa e gera o Java. Toda a lógica fica em `service.ts` (renderer) — duas helper functions e um parâmetro extra nos métodos públicos. Nenhuma mudança de UI, de IPC, de handlers Main, de engine, ou de tipos. Total: 2 ficheiros, ~33 linhas líquidas.
