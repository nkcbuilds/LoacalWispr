import { contextBridge, ipcRenderer } from 'electron';

export interface HealthResponse {
  status: string;
  version: string;
  backend: string;
  provider?: string;
  current_model?: string;
}

export interface BackendStatusEvent {
  status: 'ready' | 'error' | 'starting' | 'offline';
  health?: HealthResponse;
  message?: string;
}

const api = {
  getBackendUrl: (): Promise<string> => ipcRenderer.invoke('backend:get-url'),
  getHealth: (): Promise<HealthResponse | null> => ipcRenderer.invoke('backend:health'),
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('app:get-version'),
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke('shell:open-external', url),

  onBackendStatus: (callback: (event: BackendStatusEvent) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, data: BackendStatusEvent) => callback(data);
    ipcRenderer.on('backend:status', handler);
    return () => ipcRenderer.removeListener('backend:status', handler);
  },

  onRecordingState: (callback: (state: string) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, state: string) => callback(state);
    ipcRenderer.on('recording:state', handler);
    return () => ipcRenderer.removeListener('recording:state', handler);
  },

  onHotkeyToggle: (callback: () => void): (() => void) => {
    const handler = () => callback();
    ipcRenderer.on('hotkey:toggle-recording', handler);
    return () => ipcRenderer.removeListener('hotkey:toggle-recording', handler);
  },

  onTranscriptionComplete: (callback: (text: string) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, text: string) => callback(text);
    ipcRenderer.on('transcription:complete', handler);
    return () => ipcRenderer.removeListener('transcription:complete', handler);
  },
};

contextBridge.exposeInMainWorld('wispr', api);

export type WisprAPI = typeof api;