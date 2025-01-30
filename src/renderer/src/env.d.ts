/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly RENDERER_VITE_API_IGRP_VERSIONS: string
    readonly ELECTRON_RENDERER_UPDATE_SERVER: string
    // more env variables...
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
