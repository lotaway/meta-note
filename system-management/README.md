# Meta Note - Electron Application

这是一个基于 Electron + React + TypeScript + Vite 构建的桌面应用。

## Environment Configuration

The application uses environment variables for configuration.

### 1. Setup Environment File

```bash
cp .env.example .env
```

### 2. Configure Voice API

Edit `.env` and set the voice service endpoint:

```bash
VITE_VOICE_API_URL=http://localhost:8000
```

## Running the Application

### Development mode
```bash
yarn dev
```

### Build application
```bash
yarn build
```

## Features

### Voice Transcription & Subtitles

Real-time transcription of microphone or system audio with a customizable overlay.

1. **Select Source**
   - **Microphone**: Direct environment recording.
   - **System Audio**: Select a specific window or tab from the list.

2. **Start Transcription**
   - Click **"Start Recording"** in the control panel.
   - Data is streamed to the backend for processing.

3. **Floating Subtitles**
   - Click **"Open Subtitles"** to show the overlay.
   - Click ⚙️ on the overlay to customize:
     - Font size and color
     - Text outline color and width

4. **File Transcription**
   - Upload local audio/video files (MP3/MP4) for offline transcription.

### Backend Requirements

Requires a compatible backend service:
- `POST /voice/to/text` (Supports SSE stream and chunked uploads)
