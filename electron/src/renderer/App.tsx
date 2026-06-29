import { useCallback, useEffect, useState } from 'react';
import { Mic, Settings, Wifi, WifiOff } from 'lucide-react';
import type { BackendStatus, ModelInfo, RecordingState } from '@shared/types';
import { api } from '@/lib/api';
import { useBackendWebSocket } from '@/hooks/useBackendWebSocket';
import { StatusBar } from '@/components/StatusBar';
import { RecordingArea } from '@/components/RecordingArea';
import { ModelSelector } from '@/components/ModelSelector';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function App() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('starting');
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState('small.en');
  const [backendVersion, setBackendVersion] = useState<string | null>(null);
  const [lastTranscription, setLastTranscription] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadModels = useCallback(async (): Promise<void> => {
    try {
      const list = await api.models();
      setModels(list);
    } catch {
      // backend may still be starting
    }
  }, []);

  const checkHealth = useCallback(async (): Promise<void> => {
    try {
      const health = await api.health();
      setBackendStatus('ready');
      setBackendVersion(health.version);
      if (health.current_model) setSelectedModel(health.current_model);
      setErrorMessage(null);
      await loadModels();
    } catch {
      setBackendStatus('offline');
    }
  }, [loadModels]);

  useBackendWebSocket({
    onStateChange: setRecordingState,
    onTranscriptionComplete: setLastTranscription,
    onError: setErrorMessage,
    onModelChanged: setSelectedModel,
    onModelDownloaded: () => void loadModels(),
  });

  useEffect(() => {
    const unsubStatus = window.wispr.onBackendStatus((event) => {
      if (event.status === 'ready') {
        setBackendStatus('ready');
        setBackendVersion(event.health?.version ?? null);
        if (event.health?.current_model) setSelectedModel(event.health.current_model);
        setErrorMessage(null);
        void loadModels();
      } else if (event.status === 'error') {
        setBackendStatus('error');
        setErrorMessage(event.message ?? 'Backend error');
      }
    });

    const unsubRecording = window.wispr.onRecordingState((state) => {
      setRecordingState(state as RecordingState);
    });

    const unsubTranscription = window.wispr.onTranscriptionComplete((text) => {
      setLastTranscription(text);
      setRecordingState('idle');
    });

    void checkHealth();

    return () => {
      unsubStatus();
      unsubRecording();
      unsubTranscription();
    };
  }, [checkHealth, loadModels]);

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Mic className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">WisprLocal</h1>
            <p className="text-xs text-muted-foreground">Local voice-to-text</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={backendStatus === 'ready' ? 'success' : 'warning'}>
            {backendStatus === 'ready' ? (
              <Wifi className="mr-1 h-3 w-3" />
            ) : (
              <WifiOff className="mr-1 h-3 w-3" />
            )}
            {backendStatus === 'ready' ? 'Backend connected' : backendStatus}
          </Badge>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-6 overflow-auto p-6">
        {errorMessage && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        )}

        {lastTranscription && (
          <div className="rounded-lg border border-border bg-card/50 px-4 py-3 text-sm">
            <span className="text-muted-foreground">Last transcription: </span>
            <span className="text-foreground">{lastTranscription}</span>
          </div>
        )}

        <ModelSelector
          models={models}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          onModelsChanged={() => void loadModels()}
          disabled={backendStatus !== 'ready' || recordingState !== 'idle'}
        />

        <RecordingArea state={recordingState} />
      </main>

      <StatusBar
        model={selectedModel}
        backendStatus={backendStatus}
        backendVersion={backendVersion}
        hotkey="Alt + V"
      />
    </div>
  );
}