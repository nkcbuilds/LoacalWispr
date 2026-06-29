import type { BackendStatus } from '@shared/types';
import { Keyboard } from 'lucide-react';

interface StatusBarProps {
  model: string;
  backendStatus: BackendStatus;
  backendVersion: string | null;
  hotkey: string;
}

export function StatusBar({ model, backendStatus, backendVersion, hotkey }: StatusBarProps) {
  return (
    <footer className="flex items-center justify-between border-t border-border bg-card/50 px-6 py-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-4">
        <span>
          Model: <span className="font-medium text-foreground">{model}</span>
        </span>
        <span>
          Backend:{' '}
          <span className="font-medium text-foreground">
            {backendStatus}
            {backendVersion ? ` (v${backendVersion})` : ''}
          </span>
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <Keyboard className="h-3.5 w-3.5" />
        <span>
          Press <span className="font-medium text-foreground">{hotkey}</span> to toggle recording
        </span>
      </div>
    </footer>
  );
}