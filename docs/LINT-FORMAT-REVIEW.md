# Revisão: ESLint + Prettier → Biome

## O que existe atualmente (a remover)

### Dependências no `package.json`

| Tipo | Pacote | Uso |
|------|--------|-----|
| **dependencies** | `eslint-plugin-react-refresh` | Regras ESLint para React Refresh (Vite) |
| **devDependencies** | `eslint` | Core ESLint |
| | `eslint-config-prettier` | Desativa regras ESLint que conflituam com Prettier |
| | `eslint-plugin-jest` | Regras ESLint para Jest |
| | `eslint-plugin-react` | Regras ESLint para React |
| | `eslint-plugin-react-hooks` | Regras hooks React |
| | `@typescript-eslint/eslint-plugin` | Regras TypeScript |
| | `@typescript-eslint/parser` | Parser TypeScript para ESLint |
| | `@electron-toolkit/eslint-config-prettier` | Config Prettier do electron-toolkit |
| | `@electron-toolkit/eslint-config-ts` | Config TS do electron-toolkit |

**Nota:** Não há pacote `prettier` explícito; a formatação era feita via `eslint-config-prettier` (desativar conflitos) e possivelmente pela extensão VS Code.

### Ficheiros de configuração (a remover)

- `eslint.config.mjs` – configuração ESLint flat config
- `.prettierrc.yaml` – opções Prettier (singleQuote, semi: false, printWidth: 100, trailingComma: none)
- `.prettierignore` – ficheiros ignorados pelo Prettier

### VS Code (a atualizar)

- `.vscode/settings.json` – `editor.defaultFormatter` para JavaScript está `esbenp.prettier-vscode` → usar Biome
- `.vscode/extensions.json` – recomenda `dbaeumer.vscode-eslint` → recomendar extensão Biome

---

## O que fica (Biome)

- **Já no projeto:** `@biomejs/biome` em devDependencies e scripts `lint` / `format`.
- **A adicionar:** `biome.json` com regras e formatação alinhadas ao antigo Prettier (singleQuote, semicolons: asNeeded, lineWidth: 100, trailingCommas: none).

---

## Resumo de remoções

1. Remover do **package.json** (dependencies): `eslint-plugin-react-refresh`
2. Remover do **package.json** (devDependencies): todos os pacotes listados na tabela acima
3. Apagar: `eslint.config.mjs`, `.prettierrc.yaml`, `.prettierignore`
4. Atualizar: `.vscode/settings.json` e `.vscode/extensions.json` para Biome
