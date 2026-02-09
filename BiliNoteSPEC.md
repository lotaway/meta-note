Video Note Integration Spec

Goals:
- Electron React UI for note management
- REST API for core functionality (aligned with BiliNote)
- Multi-modal: Text-only, Audio transcribing fallback, Video Grid (3x3) understanding
- Client-side processing (yt-dlp + FFmpeg), external LLM provider

Data Flow:
1. User inputs URL + selects mode (Text/Screenshot/Video Understanding)
2. Fetch subtitles; Fallback to downloading audio + Whisper transcription if needed
3. For Image modes: Download video -> Extract frames -> Generate 3x3 grids (Base64)
4. Send text + images (if any) to external LLM
5. Store markdown results locally

API Request:
{
  "video_url": "https://...",
  "style": "minimal|detailed|academic...",
  "formats": ["toc", "summary"],
  "options": {
    "screenshot": boolean,
    "videoUnderstanding": boolean
  }
}

Implementation:
1. Services (nestjs/services/):
   - YtDlpDownloader: Audio/Video/Subtitle downloads
   - VideoProcessor: Frame extraction & 3x3 grid generation (FFmpeg xstack)
   - Transcriber: Audio to text (external/local)
   - NoteService: Process orchestration & Store results
2. Controller: NoteController for REST endpoints
3. UI (renderer/components/): 
   - VideoNote.tsx: URL input, mode selection, Markdown rendering

File Structure:
src/
├── main/
│   ├── nestjs/
│   │   ├── controllers/note.controller.ts
│   │   └── services/
│   │       ├── note.service.ts
│   │       └── providers/
│   │           ├── yt-dlp.downloader.ts
│   │           ├── video-processor.ts
│   │           └── transcriber.ts
│   └── http-server.ts
└── renderer/
    └── components/
        └── VideoNote.tsx
