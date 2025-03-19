/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_TITLE: string
    readonly MAIN_VITE_GIT_REDIRECT_URI: string
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }