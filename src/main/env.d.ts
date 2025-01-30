/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly ELECTRON_RENDERER_UPDATE_SERVER: string
    // more env variables...
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
