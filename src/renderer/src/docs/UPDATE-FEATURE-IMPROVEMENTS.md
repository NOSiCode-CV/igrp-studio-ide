# Atualização automática (Electron) – Melhorias e boas práticas

Documento de sugestões de melhoria, evolução futura e boas práticas para o fluxo de update implementado (modal bottom-left, footer, About, main process).

---

## 1. O que está implementado (resumo)

- **Main (electron-updater.ts)**: Check no arranque, envio de `message-update` (checking, available, not-available, error, progress, downloaded). Download manual via IPC.
- **Modal bottom-left (update-banner.tsx)**: Card fixo com Later / Install Now; “Later” em sessionStorage; reabertura via evento; modal de detalhes (release notes + progresso).
- **Footer**: Exibe estado (versão, nova versão clicável, erro); clicar abre o modal global.
- **About**: Botão “Check Update”; ao detetar nova versão abre o modal global; tratamento de erro por toast.
- **Evento global**: `SHOW_UPDATE_MODAL_EVENT` para abrir o modal a partir de qualquer sítio.

---

## 2. Melhorias sugeridas (curto prazo)

### 2.1 Código e consistência

| Área | Sugestão | Motivo |
|------|----------|--------|
| **Tipos** | Centralizar `UpdateMessage` num ficheiro partilhado (ex.: `src/renderer/src/types/update.ts` ou em `electron-updater.ts` e re-exportar no preload). | Footer, About e update-banner repetem a interface; uma única fonte evita deriva. |
| **Constantes** | Mover `STORAGE_KEY`, `SHOW_UPDATE_MODAL_EVENT` para um módulo `constants/update.ts`. | Facilita manutenção e testes. |
| **Formatação de release notes** | Extrair `formatReleaseNotes()` para um util (ex.: `utils/formatReleaseNotes.ts`) e usar no modal e em qualquer outro sítio. | Evita duplicação e permite evoluir (ex.: markdown completo). |
| **Evento custom** | Preferir um nome mais específico, ex.: `igrp-studio:updates:show-modal`. | Agrupa eventos de updates e reduz risco de colisão. |

### 2.2 Main process (electron-updater)

| Melhoria | Descrição |
|----------|-----------|
| **Reativar auto-download** | No `update-available`, voltar a chamar `autoUpdater.downloadUpdate().catch(...)` para que o download comece assim que há nova versão (o modal já trata “Install Now” e progresso). |
| **Retry em erro de rede** | Em `error`, considerar lógica de retry (ex.: re-check após 5 min) ou expor “Retry” via IPC para o renderer. |
| **Logs estruturados** | Para erros, usar `log.error('Update failed', { err: error.message, type: 'update-check' })` para facilitar análise em produção. |

### 2.3 Renderer (UX e robustez)

| Melhoria | Descrição |
|----------|-----------|
| **Feedback ao clicar Install Now (available)** | Enquanto `downloadUpdate()` corre, mostrar loading no botão ou no card (ex.: “A iniciar transferência…”). |
| **Acessibilidade** | No card do modal: `role="alert"`, `aria-live="polite"` e garantir que o foco vai para o modal quando abre (ex.: primeiro botão). |
| **Tecla Escape** | Fechar o modal de detalhes com Escape (Radix já costuma suportar; confirmar). |
| **Erro no modal** | Se `updateInfo.type === 'error'`, mostrar estado de erro no modal (mensagem + “Tentar novamente” que chama check/download de novo). |

### 2.4 Footer e About

| Melhoria | Descrição |
|----------|-----------|
| **Tooltip no erro** | No footer, quando `lastUpdateType === 'error'`, o `title` já usa `updateError \|\| log`; garantir que a mensagem é curta e legível. |
| **About – dependências do useEffect** | O `useEffect` que regista `message-update` depende de `showWarningToast`; se o hook de toast não for estável, considerar ref ou registrar o listener uma vez e usar um ref para o toast. |

---

## 3. Evolução futura

### 3.1 “Required update” (atualização obrigatória)

- **Conceito**: Versão mínima obrigatória (vinda de ficheiro no S3 ou da app) para poder usar a aplicação.
- **Implementação sugerida**:
  - Endpoint ou ficheiro estático, ex.: `https://.../min-version.json` com `{ "minVersion": "0.1.0-beta.10" }`.
  - No main, após `update-available` ou em check dedicado, comparar `currentVersion` com `minVersion` (semver).
  - Se atualização for obrigatória: enviar `message-update` com tipo ex.: `required` ou flag `required: true`.
  - No renderer: modal não dispensável (sem “Later” ou “Later” apenas adia até próximo arranque); mensagem clara “É necessária uma atualização para continuar”.
  - Opcional: não abrir a janela principal até o utilizador instalar ou aceitar “Sair”.

### 3.2 Canais (beta / stable)

- **Objetivo**: Utilizadores em beta receberem pre-releases; stable só releases estáveis.
- **Como**: `electron-updater` (ex.: `allowPrerelease` + channel no feed). Manter `channel: 'latest'` ou adicionar selector na UI (Definições) para “Beta” vs “Stable” e guardar preferência (electron-store); main process usa esse valor em `setFeedURL` ou nas opções do updater.

### 3.3 Assinatura e integridade

- **Problema**: Confiar apenas em HTTPS e no signing do OS; se o S3 for comprometido, um atacante pode servir binários maliciosos.
- **Melhorias**:
  - Garantir que os instaladores são sempre assinados (macOS/Windows) e que o notarization está ativo.
  - Opcional: ficheiro de manifest no S3 com hashes (ex.: SHA256) dos ficheiros; o main process verifica após download (electron-updater pode suportar ou fazer verificação manual antes de instalar).

### 3.4 Analytics e telemetria (opcional)

- Métricas anónimas: “update-check”, “update-download-started”, “update-installed”, “update-dismissed” (sem dados pessoais).
- Ajuda a ver quantos utilizadores estão em versões antigas e se o fluxo de update é usado.

---

## 4. Boas práticas aplicáveis

### 4.1 Segurança

- **Não** expor tokens ou credenciais do S3 no renderer; o feed e o download devem ser apenas no main process.
- **Validar** no main que os IPCs `download-update` e `install-update` só são chamados em contexto de update (ex.: após um check válido); evitar que o renderer force instalação de um pacote arbitrário.
- **HTTPS** sempre para o endpoint de updates; considerar Certificate Pinning apenas se houver requisito forte (complexidade operacional maior).

### 4.2 Performance

- **Check no arranque**: Já é assíncrono; evitar bloquear a UI. O modal só aparece quando há `available`/`progress`/`downloaded`.
- **Release notes grandes**: O modal já usa `max-h-[400px] overflow-y-auto`; para notas muito longas, considerar lazy load ou truncar com “Ver mais” que expande.

### 4.3 Testes

- **Unit**: Função `formatReleaseNotes` (vários formatos de string); lógica de “mostrar modal” (ex.: `hasUpdate && (userRequestedOpen || !dismissed)`).
- **Integration**: Mock do IPC `message-update` e verificar que o modal aparece/desaparece e que os botões disparam os IPCs corretos (`download-update`, `install-update`).
- **E2E (opcional)**: Fluxo “Check for updates” → ver modal → “Later” → clicar no footer → modal abre de novo.

### 4.4 Acessibilidade e i18n

- Todas as strings de update já passam por `t()`; manter chaves em `en` e `pt` (e outras línguas) alinhadas.
- Botões: labels claros (“Install Now”, “Later”, “View progress”); ícones com `aria-hidden` onde for apenas decorativo.
- Modal: foco inicial no primeiro controlo e trap de foco dentro do modal.

### 4.5 Manutenção

- **Changelog**: Manter um CHANGELOG (ou release notes no S3) por versão; o campo `releaseNotes` do updater pode ser preenchido a partir daí no build.
- **Versionamento**: Usar semver de forma consistente (ex.: `0.1.0-beta.10`) para comparações e possível “minimum version” no futuro.
- **Documentação**: Este ficheiro; opcionalmente um diagrama de sequência (check → available → download → downloaded → install) na pasta `docs/`.

---

## 5. Checklist rápido antes de cada release

- [ ] Versão em `package.json` incrementada e alinhada ao canal (beta/stable).
- [ ] Build e publicação no S3 com o canal correto.
- [ ] Release notes preenchidas (para aparecerem no modal).
- [ ] Testar fluxo: app antiga → abre → modal aparece → Later → clicar no footer → modal abre → Install Now (quando downloaded) → reinicia.
- [ ] Testar “Check Update” na About e comportamento em caso de erro (rede/S3 em baixo).
- [ ] Confirmar que não há secrets no frontend e que os IPCs de update estão restritos ao fluxo legítimo.

---

*Documento gerado com base na implementação atual do fluxo de atualização do IGRP Studio (Electron).*
