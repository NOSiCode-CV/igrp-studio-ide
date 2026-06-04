# Release notes – IGRP Studio (latest)

Use este texto nas release notes da próxima versão (GitHub Release body, tag v{versão}). Atualize a versão no título se necessário.

---

## EN (English)

### What's new

**Update channel (Beta / Stable)**  
Choose how you receive updates:

- **Stable** – Only stable releases. Recommended for production.
- **Beta** – Includes pre-releases for early access to new features.

Go to **Settings** → **About** → **Update channel** to change. The next update check will use your selection.

**Release notes in the update dialog**  
When a new version is available, the update dialog can now show release notes fetched from GitHub Releases (or from our update server). No extra steps required.

### Improvements and fixes

- **.NET backend generation** – Generated .NET projects now build, migrate, and run end-to-end. Fixed a compile error (`CS0246`) for models with `biginteger` primary-key columns, and fixed duplicated models mapping onto the same database table (which prevented the EF Core `DbContext` from being created).
- General stability and performance improvements.

---

## PT (Português)

### Novidades

**Canal de atualizações (Beta / Estável)**  
Escolha como recebe as atualizações:

- **Estável** – Apenas versões estáveis. Recomendado para produção.
- **Beta** – Inclui pré-lançamentos para acesso antecipado a novas funcionalidades.

Em **Definições** → **Sobre** → **Canal de atualizações** pode alterar. A próxima verificação de atualizações usará a opção selecionada.

**Release notes no diálogo de atualização**  
Quando há uma nova versão, o diálogo de atualização pode mostrar as notas da release obtidas a partir do GitHub Releases (ou do nosso servidor). Não é necessário fazer nada adicional.

### Melhorias e correções

- **Geração de backend .NET** – Os projetos .NET gerados agora compilam, migram e arrancam de ponta a ponta. Corrigido um erro de compilação (`CS0246`) em modelos com colunas de chave primária `biginteger` e corrigida a colisão de modelos duplicados na mesma tabela de base de dados (que impedia a criação do `DbContext` do EF Core).
- Melhorias gerais de estabilidade e desempenho.
