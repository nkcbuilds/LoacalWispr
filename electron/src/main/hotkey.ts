import { globalShortcut, type BrowserWindow } from 'electron';

const DEFAULT_HOTKEY = 'Alt+V';

export function registerHotkey(mainWindow: BrowserWindow | null, backendUrl: string): void {
  const hotkey = DEFAULT_HOTKEY;

  const registered = globalShortcut.register(hotkey, async () => {
    mainWindow?.webContents.send('hotkey:toggle-recording');

    try {
      const response = await fetch(`${backendUrl}/api/recording/toggle`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = (await response.json()) as { state: string };
        mainWindow?.webContents.send('recording:state', data.state);
      }
    } catch {
      mainWindow?.webContents.send('backend:status', {
        status: 'error',
        message: 'Failed to reach backend',
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