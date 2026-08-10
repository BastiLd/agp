/// <reference types="vite/client" />

import type { MediaAppApi } from '../../preload';

declare global {
  interface Window {
    mediaApp: MediaAppApi;
  }
}
