/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly RENDERER_VITE_API_IGRP_VERSIONS: string
    readonly ELECTRON_RENDERER_UPDATE_SERVER: string
    readonly VITE_APP_TITLE: string
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
