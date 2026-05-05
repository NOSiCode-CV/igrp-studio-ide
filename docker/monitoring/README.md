# Monitorização local (Docker + GlitchTip)

O aviso `[Sentry] SENTRY_DSN not set` é normal **enquanto não houver DSN**. Para testar no teu PC sem usar sentry.io, podes levantar o **GlitchTip** — aceita o mesmo tipo de DSN que `@sentry/electron`.

## Requisitos

- Docker Desktop (ou Docker Engine + Compose v2)

## Arranque

Na raiz do repositório:

```bash
docker compose -f docker/monitoring/docker-compose.yml up -d
```

Aguarda ~30–60 s na primeira vez (migrações). Abre **http://localhost:8000** (o login fica em **http://localhost:8000/login** — é normal).

**Nota:** Isto é **GlitchTip** (UI própria, não a página sentry.io). O **Sentry self-hosted** oficial costuma usar a porta **9000**; aqui usamos só a **8000** neste compose.

1. Regista um utilizador (primeira vez: “Sign up” / criar conta).
2. Cria uma **organização** e um **projeto** (tipo “Electron” ou “Browser”).
3. Em **Project Settings → Client Keys (DSN)** copia o DSN (começa por `http://...`).

## Ligar o IGRP Studio

No `.env` (na raiz do projeto):

```env
SENTRY_DSN=<cola o DSN do GlitchTip>
# opcional, para o smoke test no renderer em dev:
# VITE_SENTRY_TEST=true
```

Reinicia `yarn dev`. O main e o renderer enviam eventos para o teu GlitchTip local.

### SDK (já integrado no IGRP Studio)

O projeto já usa **`@sentry/electron`** nos processos certos:

- **Main:** `@sentry/electron/main` em `src/main/helpers/logger.ts` (`initMainSentryEarly`).
- **Renderer:** `@sentry/electron/renderer` em `src/renderer/src/init-sentry.ts` (`initRendererSentry`).

Em ambos está **`autoSessionTracking: false`**, como o GlitchTip recomenda (sem suporte a sessions).

O onboarding do GlitchTip mostra `import * as Sentry from "@sentry/electron"` num único ficheiro; no Electron com Vite é mais seguro usar os subcaminhos **`/main`** e **`/renderer`** para não misturar código entre processos.

### Verificar o envio

1. Opcional: no `.env`, `VITE_SENTRY_TEST=true` e reinicia o dev — envia uma mensagem de teste do **renderer**.
2. Ou na **DevTools** do renderer (F12), corre por exemplo: `throw new Error('GlitchTip test')` (vai para o Sentry do renderer / boundary).
3. Ou força um erro no **main** (menos comum em dev).  
   Confirma no GlitchTip: **Issues** do projeto.

## Parar / limpar

```bash
docker compose -f docker/monitoring/docker-compose.yml down
```

Para apagar dados (projetos, eventos):

```bash
docker compose -f docker/monitoring/docker-compose.yml down -v
```

## Segurança

- Isto é para **desenvolvimento**. Não exponhas a porta 8000 à Internet sem HTTPS e credenciais fortes.
- Altera `SECRET_KEY`: gera com `openssl rand -hex 32` e define `GLITCHTIP_SECRET_KEY` no ambiente ou num ficheiro `.env` ao lado do `docker-compose.yml` (Compose lê variáveis para substituição).

## Alternativa (cloud)

Se preferires não correr Docker: cria um projeto gratuito em [sentry.io](https://sentry.io) e usa o DSN no `SENTRY_DSN`.

---

## Se estiveres a usar Sentry self-hosted oficial (`getsentry/self-hosted`)

Erros como:

`ConfigurationError("sentry.tsdb service failed to call validate() ... module 'sentry.tsdb.redis' has no attribute 'RedisSnubaTSDB'")`

**não vêm do GlitchTip** nem da app — vêm da **imagem/config antiga** do Sentry em Docker. A classe correcta passou a estar em `redissnuba`, não em `redis`.

**Opção A (recomendada para dev local):** usa só o compose desta pasta (**GlitchTip**) e evita o stack pesado do Sentry oficial.

**Opção B (continuar com Sentry self-hosted):**

1. Faz **upgrade alinhado** com o repositório oficial: clone [getsentry/self-hosted](https://github.com/getsentry/self-hosted), usa a **última release** e corre `./install.sh` (não mistures tags antigas de `web`/`worker` com `sentry.conf.py` novo).
2. Ou edita o `sentry/sentry.conf.py` do teu deploy e garante uma linha equivalente a:
   - `SENTRY_TSDB = "sentry.tsdb.redissnuba.RedisSnubaTSDB"`  
   (com **redissnuba** no caminho do módulo, não `sentry.tsdb.redis.RedisSnubaTSDB`).

Referência: [getsentry/self-hosted#2584](https://github.com/getsentry/self-hosted/issues/2584) e [documentação TSDB](https://develop.sentry.dev/backend/application-domains/tsdb/).
