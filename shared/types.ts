export type BackendStatus = 'starting' | 'ready' | 'error' | 'offline';

export type RecordingState = 'idle' | 'recording' | 'transcribing';

export type ModelSpeed = 'very_fast' | 'fast' | 'good' | 'acceptable';
export type ModelQuality = 'basic' | 'good' | 'better' | 'best';

export interface ModelInfo {
  id: string;
  name: string;
  size_mb: number;
  speed: ModelSpeed;
  quality: ModelQuality;
  vram_gb: number;
  downloaded: boolean;
  recommended?: boolean;
}

export interface HealthResponse {
  status: string;
  version: string;
  backend: string;
  provider?: string;
  current_model?: string;
}

export interface TranscribeResponse {
  text: string;
  duration_ms?: number;
}

export interface RecordingToggleResponse {
  state: RecordingState;
  text?: string;
  error?: string;
}

export interface WsEvent {
  type:
    | 'status'
    | 'recording_started'
    | 'recording_stopped'
    | 'transcription_started'
    | 'transcription_complete'
    | 'transcription_error'
    | 'model_download_started'
    | 'model_download_progress'
    | 'model_download_complete'
    | 'model_changed';
  state?: RecordingState;
  text?: string;
  message?: string;
  model_id?: string;
  progress?: number;
}

export interface AppSettings {
  hotkey: string;
  defaultModel: string;
  language: string;
  vadSensitivity: number;
  pasteMethod: 'clipboard' | 'direct';
  audioDevice?: string;
}

export const MODEL_CATALOG: ModelInfo[] = [
  { id: 'tiny.en', name: 'Tiny (EN)', size_mb: 75, speed: 'very_fast', quality: 'basic', vram_gb: 1, downloaded: false },
  { id: 'base.en', name: 'Base (EN)', size_mb: 145, speed: 'fast', quality: 'good', vram_gb: 1.5, downloaded: false },
  { id: 'small.en', name: 'Small (EN)', size_mb: 466, speed: 'fast', quality: 'better', vram_gb: 2, downloaded: false, recommended: true },
  { id: 'medium.en', name: 'Medium (EN)', size_mb: 1500, speed: 'good', quality: 'better', vram_gb: 4.5, downloaded: false },
  { id: 'large-v3', name: 'Large v3', size_mb: 3100, speed: 'acceptable', quality: 'best', vram_gb: 6.5, downloaded: false },
];