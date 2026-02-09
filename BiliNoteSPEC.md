Video Note Integration Spec

Goals:
- Electron as UI frontend
- Express API for same functionality as BiliNote
- yt-dlp-node + FFmpeg for video/audio download
- Client-side download, text-only upload
- LLM calls via external Provider (already exists, not in this project)

Non-Goals:
- No Python backend
- No LLM implementation (use external Provider)
- No video hosting (local storage only)

Architecture:
Electron App (system-management)
├── UI Layer (React) - User interface
├── Express API - REST endpoints
└── yt-dlp-node + FFmpeg - Download & process locally
├── LLM Provider
│   └──[External LLM Provider](https://github.com/lotaway/local-llm-provider.git) - Already exists (not in project)

Data Flow:
1. User inputs video URL
2. yt-dlp-node downloads audio + subtitles
3. Whisper (local or external) transcribes if no subtitles
4. Upload transcript text (NOT audio) to LLM Provider
5. Receive markdown from LLM Provider
6. Store files locally

API Endpoints:
POST /api/note/generate - Create note task
GET /api/note/status/{id} - Check task status
DELETE /api/note/{id} - Delete task
GET /api/note/{id} - Get result

Request:
{
  "video_url": "https://...",
  "platform": "bilibili|youtube|douyin|kuaishou",
  "style": "minimal|detailed|academic|xiaohongshu|tutorial",
  "formats": ["toc", "link", "summary"]
}

Response:
{
  "code": 200,
  "data": {
    "task_id": "uuid",
    "status": "SUCCESS",
    "markdown": "# Video Summary..."
  }
}

Implementation:

1. Add dependencies
   yarn add yt-dlp fluent-ffmpeg
   # System: FFmpeg required

2. Create note service
   src/main/services/note-service.ts:
   - downloadVideo(url, platform): Promise<string>
   - getSubtitles(videoPath): Promise<string>
   - transcribeAudio(audioPath): Promise<Transcript>
   - summarize(transcript, style, formats): Promise<string>

3. Create API controller
   src/main/nestjs/controllers/note.controller.ts:
   @Post('generate')
   async generate(req) {
     const taskId = uuid();
     // Call note-service
     return { task_id: taskId }
   }

4. Integrate with existing Express
   src/main/http-server.ts:
   app.post('/api/note/generate', noteController.generate.bind(noteController))

5. LLM integration (external Provider)
   - Already exists as process.env.LLM_PROVIDER
   - Call via HTTP to external endpoint
   - Not implemented in this project

File Structure:
src/main/
├── nestjs/
│   └── controllers/
│       └── note.controller.ts
├── services/
│   └── note-service.ts
├── downloaders/
│   └── yt-dlp.ts
├── processors/
│   ├── transcriber.ts
│   └── screenshot.ts
└── http-server.ts

Test Criteria:
- Download video from B站/YouTube/抖音/快手
- Extract subtitles or fallback to Whisper
- Upload transcript (NOT audio) to LLM
- Receive markdown response
- Store files locally

Migration from BiliNote:
- Replace Python yt-dlp with yt-dlp-node
- Replace Python Whisper with local/external service
- Replace Python GPT calls with external Provider HTTP
- Keep same API contract for UI compatibility
