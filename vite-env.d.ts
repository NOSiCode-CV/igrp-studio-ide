/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GIT_REDIRECT_URI: string;
    // Add other environment variables here if needed
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }