# LocalWispr

Privacy-first, fully local voice-to-text for Windows. Press a global hotkey, speak, and have transcribed text injected into any focused window — Cursor, VS Code, browser, terminal, and more.

**Repository:** [github.com/nkcbuilds/LoacalWispr](https://github.com/nkcbuilds/LoacalWispr)

## Features (v1.0 MVP — in progress)

- Global hotkey toggle recording (`Alt + V`, configurable)
- Modern dark UI (Electron + React 19 + Tailwind + shadcn/ui)
- Local transcription via whisper.cpp (GGML + CUDA)
- Silero VAD for silence trimming
- System tray with quick actions
- Smart text injection into focused windows
- Automatic model & binary download on first run

## Architecture

```
Electron Main Process          Python FastAPI Backend
├── Global hotkeys             ├── Audio recording (sounddevice)
├── System tray                ├── VAD (Silero)
├── Text injection             ├── whisper.cpp subprocess
└── Starts Python sidecar  →   └── Model/binary manager
```

## Prerequisites

- **Node.js** 20+
- **Python** 3.12+ (3.10+ works for scaffold)
- **NVIDIA GPU** with CUDA drivers (optional, for GPU acceleration)

## Quick Start

```bash
# Clone
git clone https://github.com/nkcbuilds/LoacalWispr.git
cd LoacalWispr

# Install dependencies
npm install
cd backend && pip install -r requirements.txt && cd ..

# Run development (Electron UI + auto-starts Python backend)
npm run dev
```

The Electron main process starts the Python backend at `http://127.0.0.1:8741`.

## Project Structure

```
LoacalWispr/
├── electron/          # Electron shell + React UI
│   ├── src/main/      # Main process (tray, hotkeys, backend manager)
│   ├── src/preload/   # Secure IPC bridge
│   └── src/renderer/  # React frontend
├── backend/           # Python FastAPI sidecar
│   └── app/           # API routes, whisper engine, model manager
├── shared/            # Shared TypeScript types
└── docs/              # Architecture notes
```

## Development Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Electron + Vite dev server |
| `npm run build` | Production build |
| `npm run backend` | Run FastAPI backend only |

## Cache Locations

Downloaded models and binaries are stored locally (never committed to git):

- Models: `%USERPROFILE%\.cache\wisprlocal\models\`
- Binaries: `%USERPROFILE%\.cache\wisprlocal\bin\`

## Privacy

- All audio stays on your machine
- No telemetry, no accounts, no cloud by default
- BYOK cloud providers are opt-in only (planned for v1.5)

## License

Private — all rights reserved.