import type { ModelInfo } from '@shared/types';
import { Download, HardDrive } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ModelSelectorProps {
  models: ModelInfo[];
  selectedModel: string;
  onSelectModel: (id: string) => void;
  disabled?: boolean;
}

const FALLBACK_MODELS: ModelInfo[] = [
  { id: 'tiny', name: 'Tiny', size_mb: 75, speed: 'very_fast', quality: 'basic', vram_gb: 1, downloaded: false },
  { id: 'base', name: 'Base', size_mb: 142, speed: 'fast', quality: 'good', vram_gb: 1.5, downloaded: false },
  { id: 'small', name: 'Small', size_mb: 466, speed: 'fast', quality: 'better', vram_gb: 2, downloaded: false },
  { id: 'medium', name: 'Medium', size_mb: 1500, speed: 'good', quality: 'better', vram_gb: 4.5, downloaded: false },
  { id: 'large-v3', name: 'Large v3', size_mb: 3100, speed: 'acceptable', quality: 'best', vram_gb: 6.5, downloaded: false },
];

const speedLabels: Record<ModelInfo['speed'], string> = {
  very_fast: 'Very Fast',
  fast: 'Fast',
  good: 'Good',
  acceptable: 'Acceptable',
};

export function ModelSelector({ models, selectedModel, onSelectModel, disabled }: ModelSelectorProps) {
  const displayModels = models.length > 0 ? models : FALLBACK_MODELS;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-medium">Transcription Model</h2>
          <p className="text-xs text-muted-foreground">GGML quantized models for whisper.cpp</p>
        </div>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Download className="h-3.5 w-3.5" />
          Download Model
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
            onClick={() => onSelectModel(model.id)}
          >
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{model.name}</CardTitle>
                {model.downloaded && (
                  <HardDrive className="h-3.5 w-3.5 text-emerald-400" />
                )}
              </div>
              <CardDescription className="text-xs">{model.size_mb} MB</CardDescription>
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