/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GIT_REDIRECT_URI: string;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  