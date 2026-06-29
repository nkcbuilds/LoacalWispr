import type { RecordingState } from '@shared/types';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecordingAreaProps {
  state: RecordingState;
}

export function RecordingArea({ state }: RecordingAreaProps) {
  const isRecording = state === 'recording';
  const isTranscribing = state === 'transcribing';

  return (
    <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-border bg-card/30 p-12">
      <div className="relative mb-6">
        {isRecording && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-red-500" />
          </span>
        )}

        <div
          className={cn(
            'flex h-24 w-24 items-center justify-center rounded-full border-2 transition-all duration-300',
            isRecording
              ? 'border-red-500 bg-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
              : 'border-border bg-secondary/50',
          )}
        >
          {isRecording ? (
            <Mic className="h-10 w-10 text-red-400" />
          ) : (
            <MicOff className="h-10 w-10 text-muted-foreground" />
          )}
        </div>
      </div>

      <h2 className="mb-2 text-xl font-medium">
        {isTranscribing ? 'Transcribing…' : isRecording ? 'Recording…' : 'Ready'}
      </h2>

      <p className="max-w-sm text-center text-sm text-muted-foreground">
        {isTranscribing
          ? 'Processing your speech with whisper.cpp'
          : isRecording
            ? 'Speak now. Press Alt + V again to stop and transcribe.'
            : 'Press Alt + V to start recording. Text will be pasted into your focused window.'}
      </p>

      {isRecording && (
        <div className="mt-8 flex h-12 items-end gap-1">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="w-1 rounded-full bg-red-400/60"
              style={{
                height: `${12 + Math.sin(i * 0.8) * 20 + Math.random() * 8}px`,
                animation: `pulse ${0.4 + (i % 5) * 0.1}s ease-in-out infinite alternate`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}