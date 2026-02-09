import { Injectable } from '@nestjs/common';
import { YtDlpDownloader } from './providers/yt-dlp.downloader';
import { Transcriber, Transcript } from './providers/transcriber';
import { LLMService } from './llm.service';
import path from 'node:path';
import fs from 'fs-extra';
import { app } from 'electron';

@Injectable()
export class NoteService {
    private readonly storageDir = path.join(app.getPath('userData'), 'notes');

    constructor(
        private readonly downloader: YtDlpDownloader,
        private readonly transcriber: Transcriber,
        private readonly llmService: LLMService
    ) {
        fs.ensureDirSync(this.storageDir);
    }

    async generateNote(videoUrl: string, style: string = 'detailed', formats: string[] = ['toc', 'summary']): Promise<string> {
        const taskId = Date.now().toString();
        const taskDir = path.join(this.storageDir, taskId);
        await fs.ensureDir(taskDir);

        try {
            // 1. Get subtitles or transcribe
            let transcriptText = await this.downloader.getSubtitles(videoUrl, taskDir);

            if (!transcriptText) {
                const audioPath = await this.downloader.downloadAudio(videoUrl, taskDir);
                const transcript = await this.transcriber.transcribe(audioPath);
                transcriptText = transcript.text;
            }

            // 2. Summarize via LLM
            const prompt = this.buildPrompt(transcriptText, style, formats);
            const markdown = await this.llmService.completion(prompt);

            // 3. Store result
            const resultPath = path.join(taskDir, 'note.md');
            await fs.writeFile(resultPath, markdown);

            return markdown;
        } catch (error) {
            console.error('Note generation failed:', error);
            throw error;
        }
    }

    private buildPrompt(transcript: string, style: string, formats: string[]): string {
        return `Please generate a ${style} video note based on the following transcript. 
        Include: ${formats.join(', ')}.
        
        Transcript:
        ${transcript}`;
    }
}
