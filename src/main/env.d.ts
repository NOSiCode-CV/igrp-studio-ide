/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MAIN_VITE_GIT_REDIRECT_URI
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
