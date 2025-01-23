/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly RENDERER_VITE_API_IGRP_VERSIONS: string
    // more env variables...
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
