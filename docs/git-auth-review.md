# Revisão: Git e Auth no IGRP Studio

> Documento de análise do estado actual. **Não é um plano de implementação imediato.**  
> Serve de base para decidir o que actualizar a seguir.  
> Data: 2026-08-14 · App: `igrp-studio-ide` (Electron)

---

## 1. Objectivo

Rever como o Studio:

1. **Autentica** contas GitHub / GitLab (incluindo instâncias self-hosted)
2. **Guarda** tokens e client secrets
3. **Opera Git** localmente (clone, commit, branch, pull/push/sync)
4. **Expõe** isto na UI (contas ligadas, clone, branch switcher, sync)

Não há autenticação de utilizador IGRP (Keycloak / realm) neste fluxo. O menu “user auth” no header é apenas o menu de contas Git. O realm em `docker/.igrpstudio/auth/` é da stack Docker gerada, não do login do Studio.

---

## 2. O que já existe (mapa)

```
Renderer                         Preload / IPC                      Main
─────────                        ─────────────                      ────
use-git-auth.tsx  ─────────────► github-oauth / gitlab-oauth ─────► GitAuth (OAuth)
connected-accounts.tsx                                              git-auth-factory.ts
user-auth.tsx (menu header)                                         github-auth.ts / gitlab-auth.ts
                                                                    GitStore (electron-store + safeStorage)
use-git.ts        ─────────────► clone / commit / pull / push ────► GitService (git CLI via exec)
git-sync.tsx                        branch / sync / remotes
clone-project-modal.tsx                                             GitHubService (Octokit)
repository-list.tsx                                                 GitLabService (Gitbeaker)
git-project.tsx
redux/git/*                                                         git-handler.ts
```

### Ficheiros-chave

| Camada | Ficheiro | Papel |
|--------|----------|--------|
| OAuth | `src/main/helpers/git-auth/git-auth.ts` | Authorization code flow, callback, troca de code → token |
| OAuth | `src/main/helpers/git-auth/git-auth-factory.ts` | Constrói `GitAuth` a partir de configs persistidas (GHE / GitLab self-managed) |
| OAuth | `src/main/helpers/git-auth/github-auth.ts` | Singleton GitHub.com via env |
| OAuth | `src/main/helpers/git-auth/gitlab-auth.ts` | Singleton GitLab via env (default `https://git.nosi.cv`) |
| Store | `src/main/services/git-store.ts` | Tokens, configs de provider, paths de clone, auto-commit |
| API | `src/main/services/github-service.ts` | User + listagem de repos `.igrpstudio` |
| API | `src/main/services/gitlab-service.ts` | Idem para GitLab |
| Git CLI | `src/main/services/git-service.ts` | Todas as operações git locais |
| IPC | `src/main/handlers/git-handler.ts` | Bridge renderer ↔ serviços |
| Boot | `src/main/index.ts` | Protocol `igrp-studio://`, handlers OAuth, init de serviços |
| UI | `src/renderer/src/hooks/use-git-auth.tsx` | Estado de login / providers |
| UI | `src/renderer/src/hooks/use-git.ts` | Commit / sync / remotes |
| UI | `src/renderer/src/browser/settings/sections/connected-accounts.tsx` | Definições → Contas |
| Estado | `src/renderer/src/redux/git/reducer.ts` | Users, repos, providers GitLab |

---

## 3. Fluxo de auth (como funciona hoje)

### 3.1 OAuth

1. Renderer envia `github-oauth` ou `gitlab-oauth` (opcionalmente com `configId`).
2. Main escolhe `buildGitAuth(config)` se houver config persistida; senão usa o singleton env (`githubAuth` / `gitlabAuth`).
3. Abre o browser (`shell.openExternal`).
4. Callback:
   - **Dev:** servidor Express em `localhost:4000/oauth/callback`.
   - **Prod:** protocol handler `igrp-studio://` (`open-url` no macOS; `second-instance` no Windows).
5. Troca `code` por `access_token` (client_id + **client_secret** no body).
6. Guarda o token em `GitStore` (`github_token` / `gitlab_token`).
7. Inicializa Octokit / Gitbeaker.
8. Envia o **access_token em claro** para o renderer (`github-oauth-success` / `gitlab-oauth-success`).
9. Renderer volta a chamar `gitauth-initialize` / `gitlab-initialize` e recarrega user + repos.

Não há PKCE. Não há parâmetro `state` (CSRF). Não há refresh token. Não há Device Flow.

### 3.2 Persistência

- Store: `electron-store` com nome `igrp-studio-auth`.
- Tokens e `clientSecret` são prefixados `enc:v1:` e cifrados com `safeStorage` **quando disponível**.
- Se `safeStorage` não estiver disponível, o valor fica em **texto claro** no JSON do store.
- Há **um token por tipo** (`github_token`, `gitlab_token`), não por instância (GitHub.com vs GHE, git.nosi.cv vs gitlab.com).

### 3.3 Providers configuráveis

Já existe um modelo genérico:

- Schema Zod: `src/main/config/git-provider-schema.ts`
- Descritores: `src/main/config/git-providers.ts` (hosts, scopes, paths OAuth, API URL)
- IPC genérico: `git-provider:list-configs | save-config | remove-config | set-active`

Mas o renderer ainda está **a meio da migração**:

- GitLab usa os IPC legado (`save-gitlab-config`, `get-gitlab-config`, …) + Redux `gitLabProviders`.
- GitHub Enterprise usa o IPC genérico, mas o estado fica só em `useState` local no ecrã de contas — **não entra no Redux**.
- A interface `IGitProvider` em `types.d.ts` **não é implementada** por nenhum serviço.

---

## 4. Fluxo Git local (como funciona hoje)

`GitService` chama o binário `git` via `child_process.exec` (shell). Operações:

| Operação | Estado | Notas |
|----------|--------|--------|
| `git init` + first commit | Existe | Faz `git add .` + commit + `branch -M main` sem perguntar identidade |
| clone | Existe | Credenciais interpoladas na URL; clone autenticado da lista OAuth usa `type: 'none'` |
| branches (list / checkout / create) | Existe | Nomes interpolados na shell |
| commit | Existe | Sempre `git add .` (stage de tudo) |
| pull / push / sync | Existe | `pull()` em falha tenta **push**; ver §6 |
| remote add / get | Existe | Validação de URL fraca |
| commits / contributors | Existe | `git log` / `git shortlog` |
| contagem ahead/behind | Existe | Depende de `origin/HEAD` |
| credential helper / SSH | Não existe | Só HTTPS + user/pass/token na URL |

A UI de clone está **triplicada**: `clone-project-modal.tsx`, `repository-list.tsx`, `git-project.tsx`. O modal ainda contém `MOCK_REPOS` com o comentário “TEMP… Remove once auth works locally”.

---

## 4b. Os três pilares: Auth × GitHub/GitLab × Project

O produto junta três coisas que **não estão realmente ligadas** no código:

```
  [1 AUTH]  OAuth GitHub / GitLab  →  token no GitStore  →  listar repos .igrpstudio
      │
      ✗  (não passa o token)
      │
  [2 GIT]   git CLI no disco do projecto  →  commit / branch / pull / push / sync
      │
      ✗  (matching de remotes partido)
      │
  [3 PROJECT]  workspace.createProject / updateProject  →  abrir no Studio
```

### Matriz GitHub vs GitLab

| Capacidade | GitHub.com | GitHub Enterprise | GitLab NOSi / self-hosted | GitLab.com |
|------------|------------|-------------------|---------------------------|------------|
| OAuth via env singleton | Sim (`github-auth.ts`) | Não | Sim (`gitlab-auth.ts` → `git.nosi.cv`) | Só se env apontar para lá |
| OAuth via config na UI | Parcial (IPC genérico) | Config grava-se; UI nunca marca “ligado”; boot perde `baseUrl` | Sim (IPC legado + Redux) | Sim, como custom |
| Token persistido | `github_token` (um só) | **Mesmo** `github_token` — pisa o do github.com | `gitlab_token` (um só) | **Mesmo** `gitlab_token` |
| Validar token no init | Sim (`users.getAuthenticated`) | Sim, mas contra api.github.com se faltar host | **Não** | **Não** |
| Refresh token | N/A (OAuth App clássica) | N/A | Emitido e **ignorado** | Emitido e **ignorado** |
| User no header | Sim (`state.userGitHub`) | Tratado como github.com | **Não** — `setProviderUser` grava em `provider.user`, o header lê `state.userGitLab` que **nunca é escrito** (`setUserGitLab` não é chamado em lado nenhum) | Idem |
| Repos na lista de clone | Sim (`state.repositoriesGitHub`) | Idem, misturados com github.com | **Não** — gravados em `provider.repositories`; `selectRepositoriesGitLab` lê array vazio | Idem |
| Clone autenticado da lista | `{ type: 'none' }` / sem auth | Idem | Idem | Idem |
| Clone URL + PAT | Só se host contém `github.com` | Ramo genérico (username = token) | Ramo genérico, **não** `oauth2:token` (isso só corre para `gitlab.com`) | `oauth2:token` |
| Logout anula cliente in-memory | Não | Não | Não | Não |

Conclusão: **GitHub.com é o único caminho que chega a parecer ligado** (header + lista de repos). GitLab autentica no Main, mas a UI de projectos/clone e o menu do header quase não o vêem. GHE e segundo GitLab ficam pelo caminho.

### Fluxo “sync com o projecto” (o que o utilizador espera vs o que corre)

Há **quatro** significados de “sync” no código. Nenhum usa a sessão OAuth.

| Nome na UI | O que faz | Liga à conta GitHub/GitLab? | Liga ao projecto do workspace? |
|------------|-----------|------------------------------|--------------------------------|
| **Sync** (ícone no header) | `git pull` + `git push` no `basePath` | Não. Usa credenciais da máquina (helper / SSH). Token OAuth não entra. | Só se o `basePath` do projecto aberto for um repo git. Em monorepo `linked` avisa no tooltip mas **continua a correr no `basePath`**, não em `gitRootPath`. |
| **Auto commit** (sidebar de commits) | Após save de page/DTO/controller/etc. faz `git add . && git commit` | Não | Sim, no `basePath` do projecto. **Não faz push.** |
| **Clone → Open project** | `git clone` + `saveOrOpenProject` (cria/actualiza projecto no workspace) | Token OAuth **não** é passado. Repos privados falham. | Sim, se o clone e o `checkAndReadBaseApi` correrem. |
| **Já clonado?** (badge na lista) | Cruza remotes locais com repos da API | Intenção sim | **Partido** — ver P12 abaixo. |

#### Cadeia clone → projecto (detalhe)

1. Renderer chama `clone-repository` com URL (+ pasta + auth opcional).
2. Main faz `git clone` e exige pasta `.igrpstudio` no destino.
3. Em sucesso: `clone-progress` → renderer `saveOrOpenProject` → `workspace.createProject` / `updateProject`.
4. Detecta `git-repo-root` e grava `gitRootPath` no projecto (monorepo).
5. Marca `add-cloned-repo` com o **id numérico** do GitHub/GitLab.

Problemas nesta cadeia:

- Três UIs, três contratos: o modal passa pasta + `{ type: 'none' }`; `repository-list` passa pasta **sem** auth; `git-project` passa **só a URL** (abre diálogo de pasta).
- Modal ainda tem `MOCK_REPOS` e `clonedRepos` inicial `[90001]`.
- IDs GitHub e GitLab partilham o mesmo array `cloned_repos: number[]` — colisão possível.
- `git-project` clone não escolhe `workspace.path/projects/<name>`.

#### Matching projecto local ↔ repo remoto (P12 — partido)

`useGit.checkLocalProjects` faz:

```
findAllProjects()           → ProjectData[]   (array)
invoke('check-git-remotes', { projects: array, githubRepos })
```

`GitService.checkGitRemotes` faz:

```
for (const project of projects?.data)   // espera { data: [] }
```

`projects` é um **array**, logo `projects.data` é `undefined`. O `for` rebenta, o `catch` devolve `{}`.

Resultado: o Studio **nunca** reconhece que um projecto do workspace já corresponde a um repo GitHub/GitLab. O badge “já clonado” só funciona se o id estiver no store `cloned_repos` (preenchido só no clone feito **dentro** desta sessão da app).

Mesmo que o shape fosse corrigido, o match é igualdade exacta `clone_url === remote` ou `html_url === remote`. Falha com:

- SSH (`git@github.com:...`)
- sufixo `.git` vs sem `.git`
- credenciais na URL
- GitLab `http_url_to_repo` vs `web_url`

#### Auto-commit no projecto

Disparado em: save de página, criar/apagar page/component/DTO/controller/enum/module, duplicate, import de tabelas, prototype AI.

Comportamento real:

- Flag `auto-commit` no mesmo store da auth. Se **nunca** foi gravada, `isAutoCommit()` é `undefined` (falsy) → `createGitCommit` **salta o commit e devolve sucesso**.
- A switch na sidebar inicializa visualmente a `true`, depois lê o store. UI e comportamento divergem.
- Commit = `git add .` no `basePath` (stage de tudo nessa pasta).
- **Não há push.** O utilizador tem de carregar Sync à parte.
- Sync **não** faz commit antes do pull/push. Working tree sujo → pull falha ou mistura.

#### Sync no header (pull + push)

```
SyncButton → syncChanges(basePath, activeBranch)
  → git push --dry-run origin HEAD
  → se branch remoto “existe”: pull + push
  → senão: publish (push -u)
```

Falhas específicas:

- **Sem token OAuth.** Repo privado / GitLab NOSi depende de `git credential` do OS. Quem só fez login no Studio não consegue sync.
- `pull()` se falhar executa `git push -u` e reporta sucesso (perigoso).
- `isRemoteBranchExists` trata stdout vazio como “existe”.
- `activeBranch` vem do Redux global. Trocar de projecto sem o BranchSwitcher actualizar pode syncar o branch do projecto anterior.
- `pull-changes` IPC (não usado pela UI do header, mas existe) **não envia `branch`** → `git pull origin undefined`.
- Monorepo `linked`: tooltip avisa `gitRootPath`, mas `SyncButton` e `BranchSwitcher` recebem `basePath`. `git add .` no subfolder; pull/push afectam o repo inteiro.

#### GitLab no header vs nas Definições

| Superfície | GitHub | GitLab |
|------------|--------|--------|
| Definições → Contas | Cartão default + GHE custom | Lista `gitLabProviders` + `provider.user` |
| Header `GitConnectionMenu` | `userGitHub` — funciona | `userGitLab` — **sempre null após login** |
| Login pelo header | `github-oauth` sem configId | `gitlab-oauth` com id do primeiro provider Redux (`gitlab-nosi`). Esse id **pode não existir no GitStore** → cai no singleton env |
| Evento `gitlab-oauth-success` | — | Payload **não inclui `providerId`**. Renderer usa `activeProviderIdRef`, sujeito a race |

---

## 4c. Ponta a ponta: multi-provider GitLab (várias instâncias)

A UI sugere que se podem adicionar **N GitLabs** (NOSi + gitlab.com + self-hosted). O Main até grava N configs. A sessão real é **uma**: um cliente Gitbeaker, um `gitlab_token`, um host.

### O que o utilizador pensa que está a configurar

```
Definições → Contas
  ├─ GitLab NOSi          (default, env)     id = gitlab-nosi
  ├─ GitLab Acme          (Add GitLab)       id = nanoid()
  └─ GitLab.com           (Add GitLab)       id = nanoid()
         │
         Connect / Activate / Disconnect por cartão
```

### O que o código realmente tem

```
GitStore
  providerConfigs[]     ← N hosts + clientId/secret   (persistido)
  gitlab_token          ← UM access token             (persistido)
  active flag por config← escrito por set-active-gitlab-config
                          NUNCA lido por GitLabService

GitLabService
  let gitlab = null     ← UM cliente in-memory
  initialize(token, baseUrl?)
      host = baseUrl || VITE_GITLAB_HOST   ← não é VITE_GITLAB_BASE_URL

Redux gitLabProviders[] ← cópia da UI, incluindo default sintético
activeProviderId        ← um só; “Activate” só muda isto
```

`getActiveProviderConfig('gitlab')` existe na factory e **não é chamado** no boot nem no switch.

### Viagem 1 — ligar o GitLab NOSi default

| Passo | Código | Resultado |
|-------|--------|-----------|
| 1. Abrir Contas | `getGitlabConfig()` inventa `{ id: 'gitlab-nosi', isDefault: true }` a partir de `VITE_GITLAB_*`. **Não grava no GitStore.** | Cartão aparece. |
| 2. Connect | `loginGitLab('gitlab-nosi')` → `gitlab-oauth` com configId `gitlab-nosi` | |
| 3. Main | `getProviderConfigById('gitlab-nosi')` → **null** → fallback `gitlabAuth` singleton | OAuth em `VITE_GITLAB_BASE_URL` ou `https://git.nosi.cv` |
| 4. Token | `setToken('gitlab', token)` | Um slot. |
| 5. Init API | Singleton **não tem `baseUrl`**. `GitLabService.initialize(token)` usa `VITE_GITLAB_HOST`. | Em `.env` de dev **não existe** `VITE_GITLAB_HOST`. Em `.env.production` está **vazio**. Cliente aponta para o default do Gitbeaker (`gitlab.com`), não para `git.nosi.cv`. |
| 6. Renderer | `gitlab-initialize(token, providerId)` — handler **ignora** o 2.º arg e volta a init **sem host** | Confirma o cliente no host errado. |
| 7. User/repos | `setProviderUser` / `setProviderRepositories` no id activo | Header lê `state.userGitLab` (vazio). Listas lêem `state.repositoriesGitLab` (vazio). |
| 8. Restart | `initializeServices()`: token + sem host | Mesmo mismatch. `activeProviderId` começa `null` → load GitLab é **saltado**. UI: desligado. Token: ainda lá. |

**Falhou:** host OAuth ≠ host API; default não é uma config persistida; UI não restaura sessão GitLab.

### Viagem 2 — adicionar um segundo GitLab (self-hosted / gitlab.com)

| Passo | Código | Resultado |
|-------|--------|-----------|
| 1. Add GitLab + Save | `save-gitlab-config` → GitStore com `type: 'gitlab'` | Persistido. |
| 2. Redux | `updateGitLabProvider({ id })` — se o id **ainda não está** na lista (caso new), o reducer **não faz nada**. `getGitlabConfig()` **não é chamado** após save (GitHub sim, recarrega). | Cartão novo **não aparece** até sair e voltar às Definições. |
| 3. Connect (depois de remount) | `buildGitAuth(cfg)` com o host certo | Authorize/token no host custom. |
| 4. `handleAuthSuccess` | `GitLabService.initialize(token, config.baseUrl)` | Cliente **correcto** por um instante. |
| 5. Evento success | `{ access_token, scope, baseUrl }` — **sem `providerId`** | Renderer adivinha pelo `activeProviderIdRef`. |
| 6. `gitlab-initialize` | Init **sem** `baseUrl` | Cliente correcto **é destruído**. Volta a `VITE_GITLAB_HOST` / gitlab.com. User info 401 ou lista vazia. |
| 7. Token | `gitlab_token` sobrescrito | Sessão do GitLab NOSi **apagada**. Não há token por `id`. |
| 8. Activate o NOSi | `handleActivateProvider` = **só Redux**. Não chama `set-active-gitlab-config`, não troca cliente, não recarrega repos. | Toast “activated”. API continua no último cliente. Flag `active` no store inalterada. |

**Falhou:** N configs, 1 token, 1 cliente; save não refresca a lista; Activate é cosmética; re-init apaga o host custom.

### Viagem 3 — três GitLabs ao mesmo tempo (o que a UI permite)

Impossível ao nível de sessão.

- `setActiveProviderConfig(id, scopeToType=true)` permite *uma flag active por tipo* no JSON. O serviço ignora essa flag.
- Logout de um cartão chama `logout-gitlab` **sem usar o id** → apaga o único token → todos os GitLabs ficam sem sessão.
- Logout **não** faz `gitlab = null`. Pedidos seguintes ainda usam o cliente antigo até restart.
- Cache de repos chave `gitlab` (não `gitlab:<id>`). Activate sem re-init pode mostrar repos da instância anterior durante 5 min.
- Header “Connect GitLab” não escolhe instância: usa sempre `gitLabProviders[0]` (= NOSi).
- Dois “Connect” seguidos: `activeAuthInstance` é global. O callback do primeiro pode ser consumido pelo segundo (`client_secret` / host errados).

### Viagem 4 — config / env (dev vs prod)

Não copiar secrets. Os ficheiros `.env` e `.env.production` **não estão no `.gitignore`** (só `.env.local` / `.env.signing`). Client id/secret GitHub e GitLab estão em claro com prefixo `VITE_` (vão para o bundle do renderer).

| Variável | Dev (`.env`) | Prod (`.env.production`) | Quem lê | Problema |
|----------|--------------|--------------------------|---------|----------|
| `VITE_GITLAB_BASE_URL` | `https://git.nosi.cv` | **ausente** | OAuth singleton, Redux default | Prod cai no fallback `git.nosi.cv` só no singleton. |
| `VITE_GITLAB_HOST` | **ausente** | **vazio** | `GitLabService.initialize` | API client ≠ OAuth host. Dev/prod apontam ao default Gitbeaker. |
| `VITE_GIT_REDIRECT_URI` | `igrp-studio://oauth/callback` | igual | OAuth **prod** | Todas as OAuth Apps (NOSi, custom, GitHub) têm de usar o **mesmo** callback. A UI de “Add GitLab” não avisa. |
| `VITE_DEV_PORT` | `3000` | `3000` | `GitAuth` callback HTTP | Express escuta `localhost:3000/oauth/callback`. Colisão provável com o renderer. Código ainda tem fallback `4000` se a env faltar. |
| `VITE_NODE_ENV` | `development` | `production` | Escolhe callback HTTP vs protocol | |

Dois nomes para o mesmo host (`BASE_URL` vs `HOST`) é a falha de configuração que parte o GitLab NOSi mesmo **sem** segundo provider.

### Viagem 5 — abrir Definições depois de login GitLab

`getGitlabConfig()` faz `setGitLabProviders([default, ...stored])`.

Os objectos stored **não têm** `user` nem `repositories`. O merge **apaga** o estado de sessão na UI.

`isInitialized` quase nunca passa a `true` no caminho novo (`setProviderRepositories` não o liga). Mesmo assim, se algum consumer já carregou dados, reabrir Contas mostra os cartões como “Connect” outra vez, com o token ainda no Main.

Custom GitLab usa `isConfigured={provider.isConfigured}` → `undefined` → o botão não desactiva, mas também não há sinal de “configurado”. O default usa env; os custom usam outro critério no GitHub (`!!clientId && !!clientSecret`) e **não** no GitLab.

### Lista fechada — falhas de implementação multi-provider GitLab

| ID | Falha | Camada |
|----|--------|--------|
| M1 | Default `gitlab-nosi` é sintético (Redux/env), não persiste. OAuth com esse id cai sempre no singleton. | Config |
| M2 | `VITE_GITLAB_BASE_URL` (OAuth) ≠ `VITE_GITLAB_HOST` (API). HOST em falta/vazio. | Config |
| M3 | Singleton GitLab **não passa `baseUrl`** para o service. | Auth |
| M4 | `gitlab-initialize` ignora `providerId` e `baseUrl`; destrói o init correcto do `handleAuthSuccess`. | Auth |
| M5 | Um `gitlab_token` para N instâncias. Ligar B apaga A. | Store |
| M6 | `GitLabService` é um singleton in-memory. Não há mapa `id → client`. | Service |
| M7 | `getActiveProviderConfig` / flag `active` no store **não são lidos** no boot nem no Activate. | Service |
| M8 | Activate na UI é só `dispatch(setActiveProvider)`. Não persiste, não troca host, não recarrega. | UI |
| M9 | Save de GitLab novo: Redux `update` no id inexistente = no-op; lista não recarrega. | UI |
| M10 | Reabrir Contas faz merge e **apaga** `user`/`repositories` dos providers. | Estado |
| M11 | Evento OAuth sem `providerId`. Race se o activo mudou durante o browser. | Auth |
| M12 | Logout GitLab ignora o id; não anula o cliente. | Auth |
| M13 | Cache de repos por tipo, não por instância. | Service |
| M14 | Header não escolhe qual GitLab ligar (`[0]` = NOSi). | UI |
| M15 | Redirect URI global; cada OAuth App self-hosted tem de a copiar à mão. Sem ajuda na UI. | Config |
| M16 | `isConfigured` só existe no default. Custom GitLab não usa o mesmo critério que custom GitHub. | UI |
| M17 | Dois IPC (`save-gitlab-config` vs `git-provider:save-config`) com contratos de erro diferentes. GitHub recarrega lista; GitLab não. | IPC |
| M18 | Dev callback na porta `VITE_DEV_PORT` (3000). Risco de colisão. Sem timeout do servidor Express. | OAuth |
| M19 | Secrets `VITE_*` em `.env` / `.env.production` (ficheiros potencialmente versionados). | Segurança |
| M20 | Selectors de user/repos GitLab apontam para campos que o fluxo multi-provider **não escreve**. | Estado |

Enquanto M1–M7 não estiverem fechados, **adicionar mais GitLabs na UI só aumenta configs mortas**. A segunda instância não pode funcionar de verdade.

---

## 4d. UI de clone e lista de projectos Git

Há **três** implementações. Só uma está ligada ao produto.

| Superfície | Ficheiro | Onde aparece | Estado |
|------------|----------|--------------|--------|
| **Clone Project modal** | `clone-project-modal.tsx` | Workspace → ⋮ → Clone Project | **UI viva** (redesign 02) |
| Lista em linha | `repository-list.tsx` + `list-git-project.tsx` | **Nenhum import** | Código morto |
| Grelha de cards | `git-project.tsx` + `card-git-project.tsx` | **Nenhum import** | Código morto |

A lista de projectos do workspace (`project-list.tsx`) é outra coisa: mostra projectos **já no disco**, sem origem GitHub/GitLab, sem badge de remote, sem “clonado de…”. Depois do clone, o projecto cai nessa grelha como qualquer outro.

`ProjectNameDialog` também está órfão: o `git clone` que pedia o nome está **comentado** no Main.

### O que o modal vivo faz hoje

```
⋮ → Clone Project
  ├─ Tab "Repository URL"
  │     URL + Auth Type: None | Basic | Token (PAT colado à mão)
  └─ Tab "Search Repositories"
        filtro local GitHub/GitLab + lista para seleccionar
        footer: Clone Project  /  Open Project (se “já clonado”)
```

Visualmente o redesign (tokens, portal, tabs, lista com ícone de plataforma) está à frente do resto do git. O comportamento por baixo **não acompanha**.

### Falhas de UI / UX — modal de clone (prioridade)

| ID | Problema | Porque importa |
|----|----------|----------------|
| U1 | **`MOCK_REPOS` quando não há conta ligada.** Seis repos inventados (gov-cv, nosi, …). Comentário no código: “TEMP… Remove once auth works locally.” | O utilizador vê uma lista falsa e tenta clonar. Falha ou clona lixo. Esconde o empty state real (“liga o GitHub/GitLab”). |
| U2 | Seed `clonedRepos = [90001]` de propósito para pré-visualizar o footer “Open Project”. O fetch de `cloned_repos` **faz merge**, não substitui. | O mock igrp-studio-horizon aparece sempre como já clonado. |
| U3 | Tab Search **não pesquisa** a API. Filtra o cache Redux (GitHub ok, GitLab vazio por A5). | “Search Repositories” é um filtro local. Sem login = mocks. Com GitLab ligado = lista vazia. |
| U4 | Sem empty state de auth. Não há “Connect GitHub / GitLab” dentro do modal. Empty copy: “Try adjusting your search or filters”. | Culpa o utilizador por um problema de sessão. |
| U5 | Clone a partir da lista usa `{ type: 'none' }`. A conta OAuth ligada **não é oferecida** como Auth Type. | Quem já fez login nas Definições ainda tem de colar um PAT no tab URL. Repos privados na Search falham. |
| U6 | Footer **“Open Project” não abre o projecto.** Se `isSelectedRepoCloned`, só faz `onClose(false)`. | Botão mentiroso. O seed U2 torna isto o caso default do primeiro mock. |
| U7 | Destino do clone **não é visível nem editável**. Sempre `{workspace}/projects/{name}`. URL sem sufixo `.git` → pasta `""`. Sem aviso se a pasta já existe. | Colisão de nomes; clone para sítio opaco. |
| U8 | Copy hardcoded em inglês (`Clone Project`, `Auth Type`, `Cloning…`, `No description provided`, …). O resto da app usa `t()`. | Quebra i18n PT. |
| U9 | “Supports GitHub, GitLab, **Bitbucket**, and custom Git URLs” — Bitbucket **não existe**. | Expectativa falsa. |
| U10 | Auth Type None/Basic/Token é um segundo sistema de credenciais, paralelo às contas ligadas. PAT em estado React (memória do renderer). | Dois modelos de auth na mesma UI. |
| U11 | Progresso = texto “Cloning…”. Sem barra, sem pasta de destino, sem cancel. Se `clone-progress` não chegar, o botão fica preso. | Clone longo parece crash. |
| U12 | Modal `max-w-[460px]`, tipos 9–11px, `ScrollArea h-[50vh]`. Lista de 20+ repos é apertada (follow-up de scroll já tinha sido “fixed”). | Densidade de redesign vs usabilidade. |
| U13 | Cores fora do token: GitLab `text-orange-500`, stars `amber`, footer Open `bg-black`. | Dark mode / tema. |
| U14 | `window.open(html_url)` em vez de `shell.openExternal`. | Electron: popups/webview em vez do browser. |
| U15 | Sem filtro por **instância** GitLab (NOSi vs gitlab.com vs custom). Só github \| gitlab. | Multi-provider invisível aqui também. |
| U16 | Optimistic `setClonedRepos` **antes** do clone. Falha → badge de clonado fica. | Estado mentiroso na lista. |
| U17 | Modal custom (`createPortal` + `motion.div`) em vez do `Dialog` do design system. Sem focus trap / Escape documentado além do backdrop. | Inconsistente com New Project / Edit Project. |
| U26 | **Erro já reproduzido: “Git auth when need fingerprint”.** Clone SSH (típico `git@git.nosi.cv:grupo/repo.git`) dispara o prompt do OpenSSH *The authenticity of host … can't be established / ED25519 key fingerprint is SHA256:… / yes/no/[fingerprint]*. O Studio chama `git clone` via `exec()` **sem TTY**, sem `GIT_TERMINAL_PROMPT=0`, sem `SSH_ASKPASS`, sem UI para aceitar a chave. O processo ou **fica preso** (Cloning…) ou falha com `Host key verification failed`. Não há tratamento deste stderr. | Primeiro clone para GitLab NOSi / qualquer host SSH novo. GitHub.com muitas vezes já está no `~/.ssh/known_hosts`; `git.nosi.cv` não. HTTPS+OAuth evitaria isto; o modal não usa a sessão OAuth (U5) e o tab URL aceita SSH (`isValidRemoteUrl` tem regex `git@…`). |

**O que NÃO fazer** quando isto for implementado: `StrictHostKeyChecking=no` por default (abre MITM). O caminho certo é: detectar URL SSH → `ssh-keyscan` → mostrar a fingerprint na UI → o utilizador confirma → gravar em `known_hosts` (de preferência um ficheiro só do Studio) → clonar. Melhor ainda: clone do Studio em **HTTPS + token da conta ligada**, e deixar SSH só para quem cola `git@…` com um passo explícito de confiança no host.

### Falhas — lista/grelha mortas (`RepositoryList` / `GitProject`)

Mesmo não montadas, são o outro desenho de “lista de projectos by git”. Se alguém as religar, estes bugs voltam:

| ID | Problema |
|----|----------|
| U18 | Empty state `noProjectsFound` **sem** CTA de login. Com GitLab partido (A5) a grelha GitHub-only parece “não há GitLab”. |
| U19 | `GitProject` duplica o JSX da grelha **três vezes** (tabs / só GitHub / só GitLab). `Tabs defaultValue={activeTab}` não sincroniza depois do mount. |
| U20 | `handleClone` em `git-project.tsx` **não passa pasta nem auth** — abre diálogo nativo e clona para o sítio que o OS escolher. |
| U21 | `RepositoryList` marca clonado + path **antes** do sucesso; no `catch` não reverte. `isCloning` desactiva **todos** os botões Clone, mas `ListGitProject` não destaca qual está a clonar. |
| U22 | `CardGitProject` / `ListGitProject` chamam `saveOrOpenProject(projectData)` com o **shape errado** (a API espera `{ project, openProject }`). “Open” na lista morta não abriria o projecto. |
| U23 | Path guardado no clone da lista é `/projects/${name}` (relativo). `handleOpen` manda isso a `check-project-config` — pasta inválida. O path absoluto só é gravado no `onSuccess` do progress. |
| U24 | Strings “Cloning...” / “Search repositories...” sem i18n. `text-gray-*` hardcoded. |
| U25 | Três listeners `clone-progress` + `request-project-name` (código comentado no Main). Há `claimCloneSuccess` precisamente porque estas superfícies se atropelavam. |

### O que a UI deveria ser (quando implementarmos)

Uma superfície só, no sítio onde o utilizador já clona: o modal (ou um painel no workspace), alinhado ao New Project.

1. **Tirar mocks e o seed 90001.** Empty states explícitos:
   - sem conta → Connect GitHub / GitLab (abre Definições ou o OAuth)
   - conta ligada, zero repos `.igrpstudio` → explicar o filtro IGRP + link para clonar por URL
   - pesquisa sem match → ajustar filtros
2. **Search = lista da sessão OAuth**, GitHub **e** GitLab, com filtro por instância. Recarregar visível (hoje o cache de 5 min é invisível).
3. **Auth Type some quando há sessão.** Default: “Usar conta ligada (GitHub / GitLab NOSi)”. PAT/basic só como fallback no tab URL.
4. **Open Project abre** o projecto no workspace (mesmo fluxo que o card da grelha). Se o path sumiu, limpar o badge e oferecer Clone outra vez.
5. Mostrar **pasta de destino** (e conflito). Aceitar URL com ou sem `.git`.
6. Progresso real (`clone-progress` já existe no Main).
7. `t()` em todas as strings; `Dialog` do DS; `shell.openExternal`.
8. **Apagar ou arquivar** `git-project.tsx`, `repository-list.tsx`, `card-git-project.tsx`, `list-git-project.tsx`, `dialog-project-name.tsx` até haver um único fluxo. Religar as três UIs é o anti-padrão actual.

A grelha de projectos do workspace pode, mais tarde, mostrar origem (`GitHub` / `git.nosi.cv`) e um atalho Sync — hoje o projecto clonado perde essa identidade.

---

## 5. O que está razoavelmente sólido

Estes pedaços podem ser reutilizados, não substituídos:

- Separação Main vs Renderer (tokens *deveriam* ficar só no Main — hoje não ficam, mas o sítio certo já existe).
- `GitStore` com `safeStorage` + prefixo de versão + migração `gitlabConfigs` → `providerConfigs`.
- Validação Zod das configs de provider no Main.
- Factory `buildGitAuth` para hosts custom.
- `GitAuthExpiredError` + broadcast `git-token-expired` / `git-rate-limited`.
- Toast de token expirado montado **uma vez** (`useGitTokenExpiredToast`) para não duplicar toasts.
- Cache in-memory de repos (TTL 5 min) e invalidação no login/logout.
- Protocolo custom `igrp-studio://` registado no boot.
- Filtro de repositórios IGRP (presença de `.igrpstudio`).
- Auto-commit configurável (mesmo store).

---

## 6. Problemas (priorizados)

### P0 — Segurança (corrigir antes de novas features)

| ID | Problema | Impacto |
|----|----------|---------|
| S1 | **Client secrets** em variáveis `VITE_*`. O prefixo Vite pode ir para o bundle do renderer. O Redux e o hook constroem o provider default com `VITE_GITLAB_CLIENT_SECRET`. | Segredo de OAuth App no cliente. |
| S2 | **Access token enviado ao renderer** no evento `*-oauth-success` e reenviado por IPC. | Token visível em DevTools, logs, memory dumps do renderer. |
| S3 | `list-configs` devolve `clientSecret` **já desencriptado** ao renderer. O formulário de contas mostra o secret. | Segredo persiste no processo UI. |
| S4 | Comandos git via `exec` com interpolação: `branchName`, `repoUrl`, `ref`, `relPath`, `remoteUrl`. | Command injection se um nome/URL for malicioso. |
| S5 | Clone autentica metendo user/password/token **na URL**. Fica no process list, no `git remote -v` e em logs. | Leak de credenciais. |
| S6 | Sem `state` / PKCE. Qualquer `code` no callback é trocado. | CSRF / hijack do code (especialmente no callback HTTP de dev). |
| S7 | Se `safeStorage` falhar, tokens e secrets ficam plaintext no `igrp-studio-auth.json`. | Persistência insegura em algumas máquinas. |
| S8 | Logout **não anula** os clientes in-memory (`octokit` / `gitlab`). | Pedidos continuam autenticados após “disconnect”. |

### P1 — Auth quebrada ou incompleta

| ID | Problema | Efeito na prática |
|----|----------|-------------------|
| A1 | Um token por tipo, não por instância. | Não dá para estar autenticado em GitHub.com **e** GHE, nem em dois GitLabs, ao mesmo tempo. |
| A2 | `gitlab-initialize` ignora o 2.º argumento (`providerId` / `baseUrl`). `GitLabService.initialize` no startup **não** restaura o host da config activa. | Após reload, GitLab self-hosted pode apontar para o host errado (`VITE_GITLAB_HOST` / default). |
| A3 | `GitHubService.initializeServices()` no boot **não passa `baseUrl`**. GHE autentica uma vez e no restart cai para `api.github.com`. | Enterprise “funciona” só até fechar a app. |
| A4 | Sucesso OAuth GitHub faz sempre `setActiveProvider('github')`, nunca o `configId` GHE. `selectActiveProvider` só conhece `'github'` ou entradas em `gitLabProviders`. | UI de GHE nunca aparece como “ligada”. Botão de custom GitHub não faz logout — só re-OAuth. |
| A5 | `setProviderRepositories` grava repos GitLab em `provider.repositories`. `selectRepositoriesGitLab` lê `state.repositoriesGitLab`, que **ninguém preenche**. | Listas de clone (`RepositoryList`, `GitProject`, modal) **não mostram repos GitLab** após login. |
| A5b | `setProviderUser` para GitLab grava `provider.user`. `selectUserGitLab` lê `state.userGitLab`. `setUserGitLab` **nunca é despachado**. | Menu do header mostra GitLab sempre desligado, mesmo após OAuth ok. |
| A6 | Clone a partir da conta ligada usa `{ type: 'none' }` (modal) ou omite auth (listas). | Repos privados falham o clone mesmo com OAuth válido. O token existe no Main e não é usado. |
| A7 | Clone com token só especializa `github.com` e `gitlab.com`. Self-hosted (`git.nosi.cv`, GHE) cai no ramo genérico. | Auth de clone incorrecta no host que a NOSi realmente usa. |
| A8 | GitLab **não valida** o token no `initialize` (não chama `Users.current()`). GitHub valida. | Token inválido só rebenta mais tarde. |
| A9 | GitLab OAuth devolve tokens com expiry + refresh. O Studio guarda só `access_token` e trata 401/403 como “expirou, volta a ligar”. | Utilizadores GitLab desligam-se sem motivo aparente. |
| A10 | HTTP 403 é tratado como token expirado. Pode ser permissão, SSO, ou rate limit (este último já tem ramo próprio, mas 403 genérico não). | Logout forçado indevido. |
| A11 | Hosts default inconsistentes: `gitlab-auth.ts` → `git.nosi.cv`; `git-providers.ts` → `gitlab.com`. | Confusão env vs descritor vs UI “GitLab NOSi”. |
| A12 | Callback de produção no Linux: `second-instance` só está no bloco `win32`. Linux depende de `open-url`, que é sobretudo macOS. | OAuth prod no Linux provavelmente falha. |
| A13 | Dev OAuth: Express na porta `4000` (`VITE_DEV_PORT`). Sem timeout, sem `server.close()` no erro, um listen falha se a porta estiver ocupada. | Segundo login em simultâneo / conflito de porta. |
| A14 | `handleProtocolCallback` troca o code com `isDev=false` (redirect URI de prod) mesmo quando o flow começou em dev. | Duplo caminho de callback pode usar redirect URI errada. |

### P1b — Auth desligada do projecto / sync

| ID | Problema | Efeito na prática |
|----|----------|-------------------|
| P12 | `checkGitRemotes` itera `projects.data`, mas o renderer envia `ProjectData[]`. | Matching workspace ↔ GitHub/GitLab **nunca corre**. “Já clonado” só sobrevive via `cloned_repos` desta máquina/sessão. |
| P13 | Clone autenticado não injeta o token OAuth. Sync/push/pull também não. | Login no Studio ≠ poder clonar ou sincronizar o projecto. São dois mundos. |
| P14 | Auto-commit não faz push; Sync não faz commit. Flag default `undefined` = commits silenciosamente ignorados. | Saves “com git” que não criam commit; Sync em working tree sujo falha. |
| P15 | Evento `gitlab-oauth-success` não envia `providerId`; `gitlab-initialize` ignora o 2.º argumento. | Race no login GitLab; host da instância activa perdido. |
| P16 | IDs numéricos GitHub e GitLab no mesmo `cloned_repos[]`. | Um repo GitLab pode aparecer como “já clonado” por colisão de id. |
| P17 | Match de remote é igualdade exacta de URL. | SSH, `.git`, hosts self-hosted e URLs com credenciais não batem. |
| P18 | Sync usa `activeBranch` global e `basePath`, não `gitRootPath`. | Branch errado entre projectos; monorepo synca o sítio errado / o repo inteiro. |

### P2 — Git local incorrecto ou perigoso

| ID | Problema | Efeito |
|----|----------|--------|
| G1 | `pull()` em falha faz `git push -u origin ${branch}` e devolve sucesso. | Divergência / overwrite remoto disfarçado de pull. |
| G2 | `isRemoteBranchExists` usa `git ls-remote --heads origin ${branch}` e trata **qualquer** exit 0 como “existe”. `ls-remote` com 0 linhas também sai 0. | Sync pensa que o branch remoto existe quando não existe. |
| G3 | `git add .` em todos os commits (incluindo init). | Stage de ficheiros que o utilizador não quis (secrets, `node_modules` se o gitignore falhar). |
| G4 | Nomes de branch / URLs não validados além de um regex frouxo. | Ver S4; também falha com branches com espaços. |
| G5 | Sem `GIT_TERMINAL_PROMPT=0` / credencial helper. Push/pull HTTPS pedem password na shell invisível ou falham opaco. Clone SSH pede fingerprint no TTY que **não existe**. | Sync de repos privados falha sem mensagem útil. Clone SSH em `git.nosi.cv` → “need fingerprint” / hang em Cloning… (U26). |
| G6 | `initializeGit` assume `user.name` / `user.email` já configurados no sistema. | First commit falha em máquinas novas. |
| G7 | Três UIs de clone + `MOCK_REPOS`. | Comportamento divergente; mocks em builds reais. |

### P3 — Arquitectura / dívida

| ID | Problema |
|----|----------|
| D1 | Dois mundos de IPC: legado GitLab + genérico `git-provider:*`. Renderer usa os dois. |
| D2 | Redux GitLab-cêntrico; GitHub é um caso especial (`'github'`); GHE não tem sítio no store. |
| D3 | `IGitProvider` declarado e não usado. Serviços são object literals com estado módulo (`let octokit`, `let gitlab`). Um só cliente activo por tipo. |
| D4 | Sem testes em `__tests__` para git/auth. |
| D5 | Scopes largos: GitHub `repo`; GitLab `api`. Mais do que o Studio precisa para listar/clonar. |
| D6 | Listagem GitLab é cara: `Projects.all` + tree **por repo** para achar `.igrpstudio`. GitHub faz `getContent` por repo (melhor, mas também N+1). |
| D7 | Cache de repos chaveada só por tipo (`github` / `gitlab`), não por instância. |
| D8 | Segredos e auto-commit / project paths partilham o mesmo store `igrp-studio-auth`. |

---

## 7. Lacunas de produto (não são bugs, são decisões)

Estas perguntas devem ser fechadas **antes** de implementar updates:

1. **O Studio precisa de login IGRP (Keycloak), ou só contas Git?** Hoje só Git. Não misturar os dois no mesmo store sem desenho.
2. **Uma conta activa de cada tipo, ou N instâncias em paralelo?** O schema já permite N configs; o token store não.
3. **OAuth App (client secret) vs GitHub App / Device Flow / PKCE?** Desktop não deve embutir client secret. Device Flow (GitHub) e PKCE (GitLab) são o caminho usual.
4. **Clone/push usam o token OAuth automaticamente, ou o utilizador cola um PAT?** Hoje nem uma coisa nem outra de forma fiável.
5. **SSH vs HTTPS?** Só HTTPS. SSH exigiria agent / chaves, fora do âmbito actual.
6. **Quem é a UI canónica de clone?** Modal vs lista vs `GitProject`.
7. **Repos listados: só `.igrpstudio`, ou todos?** O filtro actual esconde repos “normais” e dispara muitos pedidos à API.

---

## 8. Direcção recomendada (para quando formos implementar)

Ordem proposta. Cada fase deve ser um PR pequeno e testável.

### Fase 0 — Congelar e alinhar o modelo

- Um único conceito: `GitProviderInstance { id, type, host, displayName, active }`.
- Token **por `id`**, não por `type`.
- Segredos **nunca** saem do Main. Renderer só recebe `{ connected, user, host }`.
- Matar o dualismo IPC legado / genérico (renderer passa a `git-provider:*` só).

### Fase 1 — Auth segura

- Deixar de usar `VITE_*` para secrets. Secrets só no processo Main (ou melhor: PKCE / Device Flow e **zero** client secret na app).
- PKCE + `state` no `GitAuth`.
- Guardar `refresh_token` + `expires_at` (GitLab); refresh silencioso antes de 401.
- Não enviar `access_token` ao renderer.
- Logout: apagar token, anular cliente in-memory, limpar cache.
- Restaurar `baseUrl` no boot a partir da config activa.

### Fase 2 — Ligar auth ao Git CLI

- Clone / fetch / push / pull injectam o token via `GIT_ASKPASS` ou credential helper temporário — **nunca** na URL remota.
- Clone a partir da lista autenticada usa o token da instância activa (hoje `type: 'none'`).
- Self-hosted: username `oauth2` (GitLab) vs `x-access-token` (GitHub), derivado do `type`, não do hostname `github.com` / `gitlab.com`.

### Fase 3 — Git CLI à prova de shell

- Trocar `exec` por `execFile` / `simple-git` com argumentos em array.
- Validar branch names (`git check-ref-format`).
- Corrigir `pull()` (não fazer push em falha) e `isRemoteBranchExists` (verificar stdout).
- Commits: respeitar staging; não `git add .` cego, ou pelo menos honrar gitignore + opção do utilizador.
- `GIT_TERMINAL_PROMPT=0` em todas as invocações.

### Fase 4 — UI e estado

- Redux (ou um único hook) com instâncias genéricas — GitHub.com, GHE, GitLab.com, git.nosi.cv são a mesma forma.
- Unificar `VITE_GITLAB_BASE_URL` e `VITE_GITLAB_HOST` num único host por instância; o default NOSi tem de ser uma config persistida (`gitlab-nosi` no GitStore), não um objecto sintético.
- Token **e** cliente Gitbeaker **por `id`**, ou então a UI deixa de fingir N sessões (máx. 1 GitLab ligado, e Activate re-inicializa host+token).
- `gitlab-initialize` / boot devem receber `baseUrl` (ou o `id` da config). Deixar de re-init sem host depois do OAuth.
- Activate = persistir flag + trocar cliente + recarregar user/repos. Save = recarregar lista (como o GitHub já faz).
- Evento OAuth leva `providerId`. Logout anula o cliente dessa instância.
- Corrigir `checkGitRemotes` para aceitar `ProjectData[]` e normalizar URLs (HTTPS/SSH/`.git`).
- Uma superfície de clone (o modal do workspace). Remover `MOCK_REPOS`, seed `[90001]`, e o código morto `GitProject` / `RepositoryList`. Empty state de auth + Open Project a abrir de verdade. Clone da lista com a sessão OAuth.
- Contas: connect/disconnect/activate consistentes para custom GitHub.
- Sync: commit (se auto-commit) → pull --rebase ou merge explícito → push, com o token da instância activa. Não misturar branch Redux global.

### Fase 5 — Qualidade

- Testes: store encrypt/decrypt, schema, factory de endpoints, `isAuthError` / rate limit, parsing de branches, “nothing to commit”.
- Testes de integração IPC com main mockado.
- Telemetria de falha OAuth **sem** tokens (hoje há `console.log` da URL de callback).

---

## 9. O que **não** fazer nesta ronda

- Não misturar auth IGRP/Keycloak com Git OAuth.
- Não adicionar Bitbucket / Azure DevOps antes de unificar GitHub+GitLab.
- Não introduzir um segundo Git engine (isomorphic-git) em paralelo com o CLI — escolher um, depois migrar.
- Não alargar scopes. Se possível, reduzi-los (`read_repository` + clone, não `api` completo).

---

## 10. Checklist de verificação manual (estado actual)

Para reproduzir os gaps sem código:

- [ ] Login GitHub.com → restart da app → user ainda autenticado?
- [ ] Login GitLab NOSi (`git.nosi.cv`) → restart → user info / repos ainda no host certo?
- [ ] Login GHE (config custom) → o cartão na UI fica “ligado”? Sobrevive ao restart?
- [ ] Ligar GitHub **e** GitLab ao mesmo tempo → header mostra os dois? as duas listas de repos enchem?
- [ ] Login GitLab → Definições dizem ligado **e** o avatar do header também?
- [ ] Clone de repo **privado** GitHub a partir da lista (sem colar PAT).
- [ ] Clone de repo **privado** GitLab NOSi a partir da lista (sem colar PAT).
- [ ] Clone URL `https://git.nosi.cv/...` com token.
- [ ] Depois de clonar, o projecto aparece no workspace e abre no Studio.
- [ ] Reabrir a app: o mesmo repo aparece como “já clonado” na lista (matching por remote, não só `cloned_repos`).
- [ ] Save de uma page com Auto Commit ON → `git log` tem o commit. Sync a seguir faz push com a conta ligada.
- [ ] Auto Commit OFF (nunca configurado) → save **não** deve fingir sucesso de commit.
- [ ] Sync num branch que **não** existe no remoto.
- [ ] Pull com divergência local/remoto (confirmar se faz push silencioso).
- [ ] Projecto `storageMode: linked` (monorepo) → branch/sync usam `gitRootPath` ou o subfolder?
- [ ] Disconnect → novo pedido a `github-user-info` / `gitlab-user-info` (deve falhar / não usar o cliente antigo).
- [ ] OAuth em Windows e Linux empacotado (protocol handler).
- [ ] Segundo “Connect” em simultâneo em modo dev (porta 4000).

---

## 11. Resumo executivo

O Studio **já tem** as três peças (auth, git local, projecto no workspace), mas **não as costura**.

| Pilar | Estado |
|-------|--------|
| **Auth GitHub.com** | OAuth + user no header + repos na lista. Melhor caminho actual. |
| **Auth GitLab / GHE** | Token chega ao Main; UI de header e listas de clone quase não reflectem. Um token por tipo. Sem refresh. |
| **Multi-provider GitLab** | A UI aceita N instâncias; a sessão é 1 token + 1 cliente. Host OAuth (`BASE_URL`) ≠ host API (`HOST`). Default `gitlab-nosi` não persiste. Activate é cosmética. Save de um GitLab novo não actualiza a lista. |
| **Clone / lista Git** | Só o modal do workspace está vivo — e mostra **mocks** se não houver repos. Search não pesquisa a API. Open Project não abre. Sem CTA de login. `GitProject` e `RepositoryList` são código morto. |
| **Projecto (workspace)** | Clone bem-sucedido cria/abre projecto e detecta `gitRootPath`. Matching inverso (lista ↔ projectos locais) está **partido**. A grelha não mostra origem Git. |
| **Sync do projecto** | Botão do header = pull+push **sem** o token OAuth e **sem** commit prévio. Auto-commit no save = só commit local, e por default pode estar off sem a UI o dizer. |

GitHub e GitLab **não são simétricos**. Tratar “git auth” como um único feature esconde que só o GitHub.com está minimamente fechado.

Antes de features novas, fechar:

1. Tokens só no Main, **por instância** (GitHub e GitLab no mesmo modelo)  
2. OAuth com PKCE/`state` (sem client secret no cliente)  
3. Clone **e** sync do projecto a usar essa sessão  
4. User + repos GitLab no mesmo estado que o GitHub (header, listas, matching)  
5. `checkGitRemotes` + URLs normalizadas, para o workspace reconhecer clones  
6. Git CLI sem interpolação de shell; pull não faz push em falha  

Quando estas linhas estiverem acordadas, passamos à implementação por fases.
