export type BackendStatus = 'starting' | 'ready' | 'error' | 'offline';

export type RecordingState = 'idle' | 'recording' | 'transcribing';

export interface ModelInfo {
  id: string;
  name: string;
  size_mb: number;
  speed: 'very_fast' | 'fast' | 'good' | 'acceptable';
  quality: 'basic' | 'good' | 'better' | 'best';
  vram_gb: number;
  downloaded: boolean;
}

export interface HealthResponse {
  status: string;
  version: string;
  backend: string;
}

export interface TranscribeResponse {
  text: string;
  duration_ms?: number;
}

export interface AppSettings {
  hotkey: string;
  defaultModel: string;
  language: string;
  vadSensitivity: number;
  pasteMethod: 'clipboard' | 'direct';
  audioDevice?: string;
}