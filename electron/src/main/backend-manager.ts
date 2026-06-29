import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { app } from 'electron';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface HealthResponse {
  status: string;
  version: string;
  backend: string;
}

export class BackendManager {
  private process: ChildProcess | null = null;
  private readonly port: number;
  private readonly baseUrl: string;

  constructor(port: number) {
    this.port = port;
    this.baseUrl = `http://127.0.0.1:${port}`;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  private getBackendDir(): string {
    if (app.isPackaged) {
      return path.join(process.resourcesPath, 'backend');
    }
    return path.join(__dirname, '../../../backend');
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const backendDir = this.getBackendDir();
      const isWin = process.platform === 'win32';
      const pythonCmd = isWin ? 'python' : 'python3';

      this.process = spawn(
        pythonCmd,
        ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', String(this.port)],
        {
          cwd: backendDir,
          stdio: ['ignore', 'pipe', 'pipe'],
          env: { ...process.env, WISPRLLOCAL_PORT: String(this.port) },
        },
      );

      let started = false;

      this.process.stdout?.on('data', (data: Buffer) => {
        const text = data.toString();
        if (!started && text.includes('Uvicorn running')) {
          started = true;
          resolve();
        }
      });

      this.process.stderr?.on('data', (data: Buffer) => {
        const text = data.toString();
        if (!started && text.includes('Uvicorn running')) {
          started = true;
          resolve();
        }
      });

      this.process.on('error', (err) => {
        reject(new Error(`Failed to start Python backend: ${err.message}`));
      });

      this.process.on('exit', (code) => {
        if (!started) {
          reject(new Error(`Backend exited before ready (code ${code ?? 'unknown'})`));
        }
        this.process = null;
      });

      setTimeout(() => {
        if (!started) {
          started = true;
          resolve();
        }
      }, 3000);
    });
  }

  stop(): void {
    if (this.process && !this.process.killed) {
      this.process.kill();
      this.process = null;
    }
  }

  async fetchHealth(): Promise<HealthResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      if (!response.ok) return null;
      return (await response.json()) as HealthResponse;
    } catch {
      return null;
    }
  }

  async waitForReady(timeoutMs = 30_000): Promise<HealthResponse> {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      const health = await this.fetchHealth();
      if (health?.status === 'ok') {
        return health;
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    throw new Error('Backend health check timed out');
  }
}