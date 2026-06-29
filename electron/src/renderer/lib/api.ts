import type { HealthResponse, ModelInfo } from '@shared/types';

let cachedBaseUrl: string | null = null;

async function getBaseUrl(): Promise<string> {
  if (cachedBaseUrl) return cachedBaseUrl;
  cachedBaseUrl = await window.wispr.getBackendUrl();
  return cachedBaseUrl;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = await getBaseUrl();
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  health: (): Promise<HealthResponse> => request('/api/health'),
  models: (): Promise<ModelInfo[]> => request('/api/models'),
  recordingState: (): Promise<{ state: string }> => request('/api/recording/state'),
};