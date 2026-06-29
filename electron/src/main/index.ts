import { app, BrowserWindow, ipcMain, shell, Tray, Menu, nativeImage } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BackendManager } from './backend-manager';
import { registerHotkey } from './hotkey';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BACKEND_PORT = 8741;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
const backendManager = new BackendManager(BACKEND_PORT);

const isDev = !app.isPackaged;

function getPreloadPath(): string {
  return path.join(__dirname, '../preload/index.mjs');
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 640,
    minWidth: 720,
    minHeight: 480,
    show: false,
    backgroundColor: '#0a0a0a',
    title: 'WisprLocal',
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray(): void {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip('WisprLocal');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Window',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

function setupIpc(): void {
  ipcMain.handle('backend:health', async () => {
    return backendManager.fetchHealth();
  });

  ipcMain.handle('backend:get-url', () => {
    return BACKEND_URL;
  });

  ipcMain.handle('app:get-version', () => {
    return app.getVersion();
  });

  ipcMain.handle('shell:open-external', async (_event, url: string) => {
    await shell.openExternal(url);
  });
}

async function startBackend(): Promise<void> {
  try {
    await backendManager.start();
    const health = await backendManager.waitForReady(30_000);
    mainWindow?.webContents.send('backend:status', { status: 'ready', health });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown backend error';
    mainWindow?.webContents.send('backend:status', { status: 'error', message });
  }
}

app.whenReady().then(async () => {
  setupIpc();
  createWindow();
  createTray();
  registerHotkey(mainWindow, BACKEND_URL);

  await startBackend();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Keep running in tray on Windows
  }
});

app.on('before-quit', () => {
  backendManager.stop();
});