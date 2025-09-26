# 📦 JSON Schema Versioning & Validation Strategy

Este documento define o padrão oficial para garantir **compatibilidade, validação e evolução segura** dos arquivos `.json` utilizados pelo IGRP Studio e seus engines (`next`, `spring`, etc.).

> ✅ Este padrão se aplica sobre um sistema já funcional, onde os arquivos `.json` são enviados para uma engine (via npm) que valida e gera o código da aplicação.

---

## 🧱 Estrutura dos Projetos

Cada projeto gerado pelo Studio deve conter uma pasta `.igrpstudio/` com os seguintes arquivos:

```text
.igrpstudio/
  ├── base.json               # Metadados da app (name, id, schemaVersion, etc.)
  ├── controllers/
  │   └── example.json
  └── models/
      └── model.json
```

---

## 🔖 base.json – metadata central

O arquivo `base.json` contém a descrição da aplicação e **define qual versão de schema os arquivos devem seguir**.

### Exemplo:

```json
{
    "name": "My Application",
    "id": "my-app",
    "description": "Gerada com IGRP Studio",
    "generator": "next",
    "generatorVersion": "1.5.0",
    "schemaVersion": "2.0.0",
    "author": "Dev Team",
    "createdAt": "2025-05-10T12:00:00Z"
}
```

---

## 📐 Validação com JSON Schema

Todos os arquivos JSON são validados com **JSON Schema** antes de qualquer geração de código.

### 📌 1. Validação de `base.json`

Schema: `schemas/2.0.0/base.schema.json`

Campos obrigatórios:

- `name` — Nome da app
- `id` — Identificador único
- `generator` — `next`, `spring`, etc.
- `schemaVersion` — Versão do schema compatível (`2.0.0`, etc.)

### 📌 2. Validação de `controllers/*.json`

Schema: `schemas/2.0.0/controller.schema.json`

Campos obrigatórios:

- `name` — Nome do controller
- `actions[]` — Lista de ações, cada uma com:
    - `name`: nome da ação
    - `method`: método HTTP (`GET`, `POST`, etc.)

### 📌 3. Validação de `models/*.json`

Schema: `schemas/2.0.0/model.schema.json`

Campos obrigatórios:

- `name` — Nome do modelo
- `fields[]` — Campos definidos com:
    - `name`: nome do campo
    - `type`: tipo primitivo (`string`, `number`, etc.)

---

## 🔄 Versionamento de Schemas

Cada `base.json` deve incluir a propriedade:

```json
{
    "schemaVersion": "2.0.0"
}
```

O engine irá usar este valor para validar os arquivos com os schemas correspondentes localizados em `schemas/<schemaVersion>/`.

Exemplo:

- `schemaVersion: "2.0.0"` ⇒ usa arquivos de schema de `schemas/2.0.0/`

---

## 🔍 Validação Completa no Build

Durante o processo de `build` ou `publish`, o Studio deve:

1. **Ler `base.json`** e extrair o `schemaVersion`
2. **Carregar os schemas corretos**
3. **Validar:**
    - `base.json` com `base.schema.json`
    - Todos os arquivos em `controllers/*.json` com `controller.schema.json`
    - Todos os arquivos em `models/*.json` com `model.schema.json`
4. **Recusar a geração** se qualquer JSON estiver inválido

### Exemplo em Node.js (usando `ajv`):

```ts
import Ajv from 'ajv';
import fs from 'fs';
import path from 'path';

const ajv = new Ajv();
const schemaVersion = '2.0.0';
const baseSchema = require(`./schemas/${schemaVersion}/base.schema.json`);
const base = JSON.parse(fs.readFileSync('.igrpstudio/base.json', 'utf-8'));

const valid = ajv.validate(baseSchema, base);
if (!valid) {
    console.error('Erro no base.json:', ajv.errors);
    process.exit(1);
}
```

---

## 🧭 Conclusão

Este padrão de versionamento e validação dos schemas garante:

- Confiabilidade da geração de código
- Escalabilidade do Studio
- Clareza para os devs e os usuários do Studio

> 🛡️ **Recomenda-se validar os arquivos em tempo de build e antes da publicação para garantir consistência.**
