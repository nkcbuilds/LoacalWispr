import { useState } from 'react';
import type { ModelInfo } from '@shared/types';
import { MODEL_CATALOG } from '@shared/types';
import { Download, HardDrive, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface ModelSelectorProps {
  models: ModelInfo[];
  selectedModel: string;
  onSelectModel: (id: string) => void;
  onModelsChanged?: () => void;
  disabled?: boolean;
}

const speedLabels: Record<ModelInfo['speed'], string> = {
  very_fast: 'Very Fast',
  fast: 'Fast',
  good: 'Good',
  acceptable: 'Acceptable',
};

export function ModelSelector({
  models,
  selectedModel,
  onSelectModel,
  onModelsChanged,
  disabled,
}: ModelSelectorProps) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const displayModels = models.length > 0 ? models : MODEL_CATALOG;

  async function handleSelect(modelId: string): Promise<void> {
    onSelectModel(modelId);
    try {
      await api.selectModel(modelId);
    } catch {
      // selection will retry on next backend reconnect
    }
  }

  async function handleDownload(modelId: string): Promise<void> {
    setDownloading(modelId);
    try {
      await api.downloadModel(modelId);
      onModelsChanged?.();
    } finally {
      setDownloading(null);
    }
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium">Transcription Model</h2>
          <p className="text-xs text-muted-foreground">faster-whisper English models (provider-swappable)</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || downloading !== null}
          onClick={() => void handleDownload(selectedModel)}
        >
          {downloading === selectedModel ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          Download Selected
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {displayModels.map((model) => (
          <Card
            key={model.id}
            className={cn(
              'cursor-pointer transition-all hover:border-primary/50',
              selectedModel === model.id && 'border-primary ring-1 ring-primary/30',
              disabled && 'pointer-events-none opacity-50',
            )}
            onClick={() => void handleSelect(model.id)}
          >
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{model.name}</CardTitle>
                {model.downloaded && <HardDrive className="h-3.5 w-3.5 text-emerald-400" />}
              </div>
              <CardDescription className="text-xs">
                {model.size_mb} MB
                {model.recommended && (
                  <Badge variant="success" className="ml-2 text-[10px]">
                    Default
                  </Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1 p-4 pt-0">
              <Badge variant="secondary" className="text-[10px]">
                {speedLabels[model.speed]}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                ~{model.vram_gb} GB VRAM
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}