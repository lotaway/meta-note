# BiliNote API Integration Specification

> Integration guide for embedding BiliNote video summarization into Electron/desktop applications

## Overview

This document defines the API contract for integrating BiliNote's video summarization functionality into any frontend application (Electron, web, mobile).

**Reference Implementation**: `backend/app/routers/note.py`

---

## Two Architecture Options

### Option A: Server-Side (Current BiliNote)

```
┌──────────────────┐     ┌──────────────────┐
│   Your Frontend   │ ──▶ │   BiliNote API   │
│  (Electron/App)   │     │  (FastAPI)       │
│                  │     │  - yt-dlp Python │
│                  │     │  - Whisper       │
│                  │     │  - GPT          │
└──────────────────┘     └──────────────────┘
```

**Pros**: Simple frontend, no client dependencies
**Cons**: Server bandwidth, file storage, processing load

### Option B: Client-Side Download (Recommended)

```
┌──────────────────┐                           ┌──────────────────┐
│   Electron UI     │                           │   BiliNote API    │
│                  │                           │                  │
│  yt-dlp-node     │  (1) Upload transcript   │  Whisper (optional)│
│  FFmpeg          │ ───────────────────────▶ │  GPT Summary      │
│                  │  (2) Get markdown        │                  │
└──────────────────┘                           └──────────────────┘
```

**Pros**: Client downloads, less server load, only text upload
**Cons**: Client needs Node.js + FFmpeg

**npm dependencies**:
```bash
npm install yt-dlp fluent-ffmpeg
```

---

## Architecture: Client-Side Download (Recommended)

This section describes the recommended architecture where downloads happen on the client.

### Workflow

```
┌──────────────────┐
│   Electron UI     │
│                  │
│ 1. yt-dlp-node   │──▶ Download audio + subtitles
│ 2. FFmpeg        │──▶ Extract audio (if needed)
│ 3. Upload text   │──▶ POST /api/process
│ 4. Get result    │◀── Markdown response
└──────────────────┘
```

### Client Implementation Example

```javascript
// Download audio and get subtitles using yt-dlp-node
import { exec } from 'child_process';
import * as fs from 'fs';

async function downloadAndProcess(videoUrl, platform) {
  // 1. Download audio (yt-dlp-node)
  await execPromise(`yt-dlp -x --audio-format mp3 -o "audio.%(ext)s" "${videoUrl}"`);

  // 2. Get subtitles
  await execPromise(`yt-dlp --write-subs --skip-download -o "subs.%(ext)s" "${videoUrl}"`);

  // 3. Read subtitle file
  const subtitleText = fs.readFileSync('subs.json3', 'utf-8');

  // 4. Upload to server
  const response = await fetch('http://localhost:8483/api/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transcript: subtitleText,
      video_url: videoUrl,
      platform,
      // ... other params
    })
  });

  return response.json();
}
```

### Why Not Server-Side Only?

| Concern | Server-Side | Client-Side (Recommended) |
|---------|-------------|---------------------------|
| **Download bandwidth** | Server pays | Client pays |
| **Storage** | Server stores files | Client stores, upload text only |
| **FFmpeg/Python** | Server needs them | Client needs them |
| **LLM input** | Full audio/file | Text only |

**Key insight**: LLM only needs text transcript, not the actual audio/video files. Client downloads → extracts text → uploads only text to server.

---

## API Endpoints

### Base URL

```
http://{host}:{port}
Default: http://localhost:8483
```

---

## 1. Generate Video Note

Generate a summary note from a video URL.

**Endpoint**: `POST /note/generate_note`

#### Request Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `video_url` | string | Yes | - | Video URL (B站/YouTube/抖音/快手) |
| `platform` | string | Yes | - | Platform: `bilibili`, `youtube`, `douyin`, `kuaishou` |
| `quality` | string | No | `fast` | Audio quality: `fast`, `medium`, `slow` |
| `screenshot` | boolean | No | `false` | Include screenshots in note |
| `link` | boolean | No | `false` | Add time-jump links to video |
| `model_name` | string | Yes | - | LLM model name (e.g., `gpt-4`, `deepseek-chat`) |
| `provider_id` | string | Yes | - | LLM provider ID (configured in database) |
| `task_id` | string | No | - | Existing task ID for retry |
| `format` | array | No | `[]` | Output format options: `toc`, `link`, `screenshot`, `summary` |
| `style` | string | No | - | Note style: `minimal`, `detailed`, `academic`, `xiaohongshu`, `tutorial`, `meeting_minutes` |
| `extras` | string | No | - | Additional instructions for GPT |
| `video_understanding` | boolean | No | `false` | Enable video frame analysis |
| `video_interval` | integer | No | `0` | Frame capture interval in seconds |
| `grid_size` | array | No | `[]` | Grid layout for frames, e.g., `[3, 3]` |

#### Request Example

```json
{
  "video_url": "https://www.bilibili.com/video/BV1xx584s7L2",
  "platform": "bilibili",
  "quality": "medium",
  "screenshot": false,
  "link": true,
  "model_name": "deepseek-chat",
  "provider_id": "deepseek",
  "format": ["toc", "summary"],
  "style": "detailed",
  "video_understanding": false
}
```

#### Response (Immediate)

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "task_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `task_id` | string | Unique task identifier for polling status |

#### Check Task Status

**Endpoint**: `GET /note/task_status/{task_id}`

##### Response (In Progress)

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "status": "TRANSCRIBING",
    "message": "转写中...",
    "task_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

##### Response (Success)

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "status": "SUCCESS",
    "result": {
      "markdown": "# 视频总结\n\n## 标题\n...",
      "transcript": {
        "language": "zh",
        "full_text": "完整转写文本...",
        "segments": [
          {"start": 0.0, "end": 5.0, "text": "第一段文字"}
        ]
      },
      "audio_meta": {
        "title": "视频标题",
        "duration": 3600,
        "platform": "bilibili",
        "video_id": "BV1xx584s7L2"
      }
    },
    "message": "",
    "task_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

##### Response (Failed)

```json
{
  "code": 500,
  "msg": "任务失败: 详细错误信息",
  "data": {
    "status": "FAILED",
    "task_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

#### Status Values

| Status | Description |
|--------|-------------|
| `PENDING` | Task queued |
| `PARSING` | Parsing video URL |
| `DOWNLOADING` | Downloading audio/video |
| `TRANSCRIBING` | Transcribing audio to text |
| `SUMMARIZING` | Generating summary with LLM |
| `SAVING` | Saving results |
| `SUCCESS` | Completed successfully |
| `FAILED` | Task failed |

---

## 2. Upload Local File

Upload a local video/audio file for processing.

**Endpoint**: `POST /note/upload`

**Content-Type**: `multipart/form-data`

#### Request

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Video or audio file |

#### Response

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "url": "/uploads/filename.mp4"
  }
}
```

**Note**: After upload, call `POST /note/generate_note` with `video_url` set to the uploaded file URL.

---

## 3. Delete Task

Delete a generated note task.

**Endpoint**: `POST /note/delete_task`

#### Request

```json
{
  "video_id": "BV1xx584s7L2",
  "platform": "bilibili"
}
```

#### Response

```json
{
  "code": 200,
  "msg": "删除成功"
}
```

---

## 4. Image Proxy

Proxy external images (for CORS issues).

**Endpoint**: `GET /note/image_proxy?url={image_url}`

#### Use Case

When note contains images from external sources (B站 cover, screenshots), frontend may have CORS issues. Use this proxy endpoint.

#### Response

Returns the image with proper CORS headers.

---

## 5. Process Transcript (Client-Side Download Mode)

For client-side download workflow, upload transcript text directly instead of video URL.

**Endpoint**: `POST /note/process_transcript`

#### Request

```json
{
  "transcript_text": "完整的字幕文本...",
  "transcript_segments": [
    {"start": 0.0, "end": 5.0, "text": "第一段文字"},
    {"start": 5.0, "end": 10.0, "text": "第二段文字"}
  ],
  "video_meta": {
    "title": "视频标题",
    "platform": "bilibili",
    "video_id": "BVxxx"
  },
  "model_name": "deepseek-chat",
  "provider_id": "deepseek",
  "format": ["toc", "summary"],
  "style": "detailed"
}
```

#### Response

```json
{
  "code": 200,
  "data": {
    "markdown": "# 视频总结\n\n## 标题\n...",
    "task_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

#### Why This Endpoint?

In client-side download mode:
1. **Client** uses yt-dlp-node to download and extract subtitles
2. **Client** reads subtitle file locally
3. **Client** uploads transcript text (small) to server
4. **Server** generates summary using GPT
5. **Result** returned to client

**Only text is uploaded, no audio/video files.**

---

## Output Files

All outputs are saved to the `note_results` directory (configurable via `NOTE_OUTPUT_DIR`).

### File Structure

```
note_results/
├── {task_id}.status.json           # Task status (temporary)
├── {task_id}.json                  # Complete result (markdown + transcript)
└── note_results/
    ├── {task_id}_audio.json        # Audio metadata (cache)
    ├── {task_id}_transcript.json   # Transcript (cache)
    └── static/
        └── screenshots/
            └── {filename}.jpg      # Generated screenshots
```

### Result File Schema (`{task_id}.json`)

```json
{
  "markdown": "# 视频标题\n\n## 章节1\n内容...",
  "transcript": {
    "language": "zh",
    "full_text": "完整转写文本，用于搜索/索引",
    "segments": [
      {
        "start": 0.0,
        "end": 5.5,
        "text": "该时间段的文字内容"
      }
    ]
  },
  "audio_meta": {
    "title": "原始视频标题",
    "duration": 3600.0,
    "cover_url": "https://example.com/cover.jpg",
    "platform": "bilibili",
    "video_id": "BVxxx",
    "raw_info": {}  # Raw metadata from yt-dlp
  }
}
```

---

## Integration Guide

### 1. Polling Workflow

```typescript
// 1. Start generation
const { data: { task_id } } = await api.post('/note/generate_note', params);

// 2. Poll status
while (true) {
  const { data } = await api.get(`/note/task_status/${task_id}`);
  
  if (data.data.status === 'SUCCESS') {
    return data.data.result;  // Full result
  }
  
  if (data.data.status === 'FAILED') {
    throw new Error(data.data.message);
  }
  
  await sleep(2000);  // Wait 2 seconds
}
```

### 2. Frontend Code Example

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8483',
  timeout: 300000  // 5 minutes
});

class BiliNoteService {
  async generateNote(params: GenerateNoteParams): Promise<NoteResult> {
    const taskId = await this.startGeneration(params);
    return this.pollResult(taskId);
  }

  private async startGeneration(params: GenerateNoteParams): Promise<string> {
    const { data } = await api.post('/note/generate_note', params);
    return data.data.task_id;
  }

  private async pollResult(taskId: string): Promise<NoteResult> {
    while (true) {
      const { data } = await api.get(`/note/task_status/${taskId}`);
      const { status, result, message } = data.data;

      if (status === 'SUCCESS') return result;
      if (status === 'FAILED') throw new Error(message);
      
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}
```

### 3. Configuration Required

Before using, configure LLM providers in the database:

| Provider ID | Model Name | API Base URL | API Key |
|------------|------------|--------------|---------|
| `openai` | `gpt-4` | `https://api.openai.com/v1` | xxx |
| `deepseek` | `deepseek-chat` | `https://api.deepseek.com` | xxx |

**Reference**: `backend/app/db/builtin_providers.json`

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKEND_PORT` | `8483` | API server port |
| `BACKEND_HOST` | `0.0.0.0` | API server host |
| `NOTE_OUTPUT_DIR` | `note_results` | Output directory |
| `TRANSCRIBER_TYPE` | `fast-whisper` | Speech-to-text engine |
| `WHISPER_MODEL_SIZE` | `base` | Whisper model size |

---

## Error Handling

### HTTP Errors

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 400 | Bad Request | Invalid video URL, missing required params |
| 500 | Internal Error | LLM API error, download failed, transcription failed |

### Task Errors

Errors are captured in `task_id.status.json`:

```json
{
  "status": "FAILED",
  "message": "详细错误信息"
}
```

---

## Testing

### Option A: Server-Side (Original)

```bash
# Start server
cd backend
python main.py

# Test endpoint
curl -X POST http://localhost:8483/note/generate_note \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://www.bilibili.com/video/BV1xx584s7L2",
    "platform": "bilibili",
    "model_name": "deepseek-chat",
    "provider_id": "deepseek",
    "format": ["toc", "summary"]
  }'
```

### Option B: Client-Side Download (Recommended)

```bash
# 1. Install dependencies on client
npm install yt-dlp fluent-ffmpeg

# 2. Download video and extract subtitles
yt-dlp --write-subs --skip-download -o "subs" "https://www.bilibili.com/video/BV1xx584s7L2"

# 3. Upload transcript to server
curl -X POST http://localhost:8483/note/process_transcript \
  -H "Content-Type: application/json" \
  -d '{
    "transcript_text": "$(cat subs.json3)",
    "video_meta": {
      "title": "视频标题",
      "platform": "bilibili",
      "video_id": "BV1xx584s7L2"
    },
    "model_name": "deepseek-chat",
    "provider_id": "deepseek"
  }'
```

---

## Client-Side Setup

For Electron/desktop application, install these on client:

```bash
# Node.js package
npm install yt-dlp fluent-ffmpeg

# System dependency
# FFmpeg must be installed on the system
# Mac: brew install ffmpeg
# Ubuntu: sudo apt install ffmpeg
# Windows: Download from https://ffmpeg.org/download.html
```

**Client Download Workflow**:
```javascript
import { exec } from 'child_process';
import fs from 'fs';

async function processVideo(videoUrl, platform) {
  // 1. Download audio + subtitles
  await exec(`yt-dlp -x --audio-format mp3 -o "audio.%(ext)s" "${videoUrl}"`);
  await exec(`yt-dlp --write-subs --skip-download -o "subs" "${videoUrl}"`);

  // 2. Read subtitle file
  const subs = fs.readFileSync('subs.json3', 'utf-8');

  // 3. Upload transcript (NOT audio file)
  const result = await fetch('http://localhost:8483/note/process_transcript', {
    method: 'POST',
    body: JSON.stringify({
      transcript_text: subs,
      video_meta: { platform },
      model_name: 'deepseek-chat',
      provider_id: 'deepseek'
    })
  });

  return result.json();
}
```

---

## Conclusion

| Question | Answer |
|----------|--------|
| **Need Python on client?** | No! Use Node.js version |
| **Need yt-dlp on server?** | Only if using server-side download |
| **What goes to LLM?** | Only transcript text, NOT audio/video |
| **Why client download?** | Less server bandwidth, client stores files |
| **What client needs?** | Node.js + yt-dlp-node + FFmpeg |

---

## File Reference Index

| Functionality | File Path |
|---------------|-----------|
| API Endpoints | `backend/app/routers/note.py` |
| Note Generation Logic | `backend/app/services/note.py` |
| Downloaders | `backend/app/downloaders/{platform}_downloader.py` |
| Transcription | `backend/app/transcriber/whisper.py` |
| GPT Integration | `backend/app/gpt/universal_gpt.py` |
| Prompt Builder | `backend/app/gpt/prompt_builder.py` |
| Video Reader | `backend/app/utils/video_reader.py` |
| Server Entry | `backend/main.py` |
| yt-dlp-node (npm) | https://www.npmjs.com/package/yt-dlp |
| fluent-ffmpeg (npm) | https://www.npmjs.com/package/fluent-ffmpeg |
