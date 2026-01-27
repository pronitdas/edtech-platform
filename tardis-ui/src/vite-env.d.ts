/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_WS_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// PWA Register types
interface Navigator {
  readonly standalone?: boolean
}

interface WindowEventMap {
  'beforeinstallprompt': CustomEvent
  'appinstalled': CustomEvent
}
