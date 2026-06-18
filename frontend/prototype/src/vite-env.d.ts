declare global {
  interface ImportMetaEnv {
    VITE_API_URL: string;
    VITE_WS_URL: string;
    VITE_API_KEY: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};
