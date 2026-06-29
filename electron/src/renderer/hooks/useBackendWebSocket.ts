import { useEffect, useRef } from 'react';
import type { RecordingState, WsEvent } from '@shared/types';

interface UseBackendWebSocketOptions {
  onStateChange?: (state: RecordingState) => void;
  onTranscriptionComplete?: (text: string) => void;
  onError?: (message: string) => void;
  onModelChanged?: (modelId: string) => void;
  onModelDownloaded?: (modelId: string) => void;
}

export function useBackendWebSocket(options: UseBackendWebSocketOptions): void {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    async function connect(): Promise<void> {
      const baseUrl = await window.wispr.getBackendUrl();
      const wsUrl = baseUrl.replace(/^http/, 'ws') + '/api/ws/status';
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as WsEvent;
          handleEvent(data);
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (!closed) {
          reconnectTimer = setTimeout(() => void connect(), 3000);
        }
      };
    }

    function handleEvent(event: WsEvent): void {
      const opts = optionsRef.current;

      if (event.state) {
        opts.onStateChange?.(event.state);
      }

      switch (event.type) {
        case 'transcription_complete':
          if (event.text) opts.onTranscriptionComplete?.(event.text);
          break;
        case 'transcription_error':
          if (event.message) opts.onError?.(event.message);
          break;
        case 'model_changed':
          if (event.model_id) opts.onModelChanged?.(event.model_id);
          break;
        case 'model_download_complete':
          if (event.model_id) opts.onModelDownloaded?.(event.model_id);
          break;
      }
    }

    void connect();

    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);
}