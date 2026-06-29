import { globalShortcut, type BrowserWindow } from 'electron';
import { injectText } from './text-injection';

const DEFAULT_HOTKEY = 'Alt+V';

interface ToggleResponse {
  state: string;
  text?: string;
  error?: string;
}

export function registerHotkey(mainWindow: BrowserWindow | null, backendUrl: string): void {
  const hotkey = DEFAULT_HOTKEY;

  const registered = globalShortcut.register(hotkey, async () => {
    mainWindow?.webContents.send('hotkey:toggle-recording');

    try {
      const response = await fetch(`${backendUrl}/api/recording/toggle`, {
        method: 'POST',
      });

      if (!response.ok) {
        const detail = await response.text();
        mainWindow?.webContents.send('backend:status', {
          status: 'error',
          message: detail || 'Recording toggle failed',
        });
        return;
      }

      const data = (await response.json()) as ToggleResponse;
      mainWindow?.webContents.send('recording:state', data.state);

      if (data.error) {
        mainWindow?.webContents.send('backend:status', {
          status: 'error',
          message: data.error,
        });
      }

      if (data.text) {
        await injectText(data.text);
        mainWindow?.webContents.send('transcription:complete', data.text);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reach backend';
      mainWindow?.webContents.send('backend:status', {
        status: 'error',
        message,
      });
    }
  });

  if (!registered) {
    console.error(`Failed to register global hotkey: ${hotkey}`);
  }
}

export function unregisterHotkeys(): void {
  globalShortcut.unregisterAll();
}