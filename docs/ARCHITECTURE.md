# WisprLocal Architecture

## Overview

WisprLocal uses a hybrid Electron + Python architecture:

```
Electron Main Process
├── Global hotkeys, system tray, window management
├── Starts Python backend as child process
├── IPC to renderer + HTTP to backend
└── Text injection (clipboard + Ctrl+V)

Python FastAPI Backend (127.0.0.1:8741)
├── Audio recording (sounddevice)
├── VAD (Silero)
├── whisper.cpp subprocess
└── Model/binary management
```

## Communication

| Channel | Purpose |
|---------|---------|
| HTTP REST | Health, models, transcribe |
| WebSocket | Download progress, recording status |
| Electron IPC | Main ↔ Renderer UI updates |

## Cache Locations

- Models: `~/.cache/wisprlocal/models/`
- Binaries: `~/.cache/wisprlocal/bin/`