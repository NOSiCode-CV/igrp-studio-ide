/// <reference types="vite/client" />
/// <reference types="react" />
/// <reference types="react-dom" />

interface ImportMetaEnv {
    readonly VITE_DEV_PORT: string
    readonly VITE_NODE_ENV: string
    readonly RENDERER_VITE_API_IGRP_VERSIONS: string
    readonly ELECTRON_RENDERER_UPDATE_SERVER: string
    readonly VITE_APP_TITLE: string

    readonly VITE_GIT_REDIRECT_URI: string

    readonly VITE_GITHUB_CLIENT_ID: string
    readonly VITE_GITHUB_CLIENT_SECRET: string
    /** Optional: Personal Access Token for GitHub API (e.g. release notes in private repo). Not the OAuth client secret. */
    readonly VITE_GITHUB_TOKEN?: string

    /** Injected from SENTRY_DSN at build (see electron.vite.config). */
    readonly VITE_SENTRY_DSN: string
    /** Set to "true" in .env to send one test event from the renderer in dev. */
    readonly VITE_SENTRY_TEST: string
    readonly VITE_GITLAB_BASE_URL: string
    readonly VITE_GITLAB_CLIENT_ID: string
    readonly VITE_GITLAB_CLIENT_SECRET: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
