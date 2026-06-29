/// <reference types="vite/client" />

import type { WisprAPI } from '../preload/index';

declare global {
  interface Window {
    wispr: WisprAPI;
  }
}

export {};