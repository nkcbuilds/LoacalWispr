import { clipboard } from 'electron';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/**
 * Copies text to clipboard and simulates Ctrl+V into the currently focused window.
 * Does not focus or raise the WisprLocal window.
 */
export async function injectText(text: string): Promise<void> {
  if (!text.trim()) return;

  clipboard.writeText(text);

  // Brief pause so the OS clipboard is ready before paste simulation
  await new Promise((resolve) => setTimeout(resolve, 80));

  if (process.platform === 'win32') {
    await execFileAsync(
      'powershell',
      [
        '-NoProfile',
        '-WindowStyle',
        'Hidden',
        '-Command',
        'Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait("^v")',
      ],
      { windowsHide: true },
    );
    return;
  }

  // Fallback for non-Windows dev environments
  clipboard.writeText(text);
}