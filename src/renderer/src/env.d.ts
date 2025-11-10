/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEV_PORT: string
  readonly VITE_NODE_ENV: string
  readonly RENDERER_VITE_API_IGRP_VERSIONS: string
  readonly ELECTRON_RENDERER_UPDATE_SERVER: string
  readonly VITE_APP_TITLE: string

  readonly VITE_GIT_REDIRECT_URI: string

  readonly VITE_GITHUB_CLIENT_ID: string
  readonly VITE_GITHUB_CLIENT_SECRET: string
  readonly VITE_GITLAB_BASE_URL: string
  readonly VITE_GITLAB_CLIENT_ID: string
  readonly VITE_GITLAB_CLIENT_SECRET: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
