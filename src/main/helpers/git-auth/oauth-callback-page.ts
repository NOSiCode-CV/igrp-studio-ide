function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

function providerLabel(provider: string): string {
    if (provider === 'gitlab') return 'GitLab'
    if (provider === 'github') return 'GitHub'
    return provider
}

function pageShell(opts: {
    title: string
    heading: string
    body: string
    tone: 'success' | 'error'
    autoCloseSeconds?: number
}): string {
    const icon =
        opts.tone === 'success'
            ? `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="12" fill="#0d9488"/>
            <path d="M7 12.5l3.2 3.2L17 8.8" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>`
            : `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="12" fill="#b42318"/>
            <path d="M8 8l8 8M16 8l-8 8" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>
          </svg>`

    const closeScript =
        opts.autoCloseSeconds && opts.autoCloseSeconds > 0
            ? `<script>
        (function () {
          var seconds = ${opts.autoCloseSeconds};
          var el = document.getElementById('countdown');
          var tick = function () {
            if (el) el.textContent = seconds > 0
              ? 'A tentar fechar este separador em ' + seconds + 's…'
              : 'Já pode fechar este separador.';
            if (seconds <= 0) {
              window.close();
              return;
            }
            seconds -= 1;
            setTimeout(tick, 1000);
          };
          tick();
        })();
      </script>`
            : ''

    return `<!DOCTYPE html>
<html lang="pt">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>${escapeHtml(opts.title)}</title>
    <style>
      :root { color-scheme: dark; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #0f1419;
        color: #e7e5e4;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif;
      }
      .card {
        width: min(420px, calc(100vw - 32px));
        padding: 28px 24px 24px;
        border: 1px solid #292524;
        background: #1c1917;
        border-radius: 8px;
        text-align: center;
      }
      .icon { margin: 0 auto 16px; width: 28px; height: 28px; }
      h1 { margin: 0 0 8px; font-size: 18px; font-weight: 600; letter-spacing: -0.02em; }
      p { margin: 0; font-size: 13px; line-height: 1.5; color: #a8a29e; }
      .hint { margin-top: 16px; font-size: 12px; color: #78716c; }
    </style>
  </head>
  <body>
    <main class="card">
      <div class="icon">${icon}</div>
      <h1>${escapeHtml(opts.heading)}</h1>
      <p>${escapeHtml(opts.body)}</p>
      <p class="hint" id="countdown"></p>
    </main>
    ${closeScript}
  </body>
</html>`
}

export function oauthSuccessPage(provider: string): string {
    const label = providerLabel(provider)
    return pageShell({
        title: `IGRP Studio — ${label}`,
        heading: `${label} ligado`,
        body: 'Pode voltar ao IGRP Studio. A conta já está autenticada.',
        tone: 'success',
        autoCloseSeconds: 4
    })
}

export function oauthErrorPage(provider: string, message?: string): string {
    const label = providerLabel(provider)
    const detail = message?.trim()
        ? message.trim()
        : 'Tente ligar a conta outra vez a partir do Studio.'
    return pageShell({
        title: `IGRP Studio — ${label}`,
        heading: `Não foi possível ligar o ${label}`,
        body: detail,
        tone: 'error'
    })
}
