import { Injectable } from '@nestjs/common'
import { NoteController } from '../controllers/note.controller'
import { UniversalDownloader } from './providers/universal.downloader'
import { VideoProcessor } from './providers/video-processor'
import { Transcriber, Transcript } from './providers/transcriber'
import { LLMService } from './llm.service'
import path from 'node:path'
import fs from 'fs-extra'
import { app } from 'electron'

@Injectable()
export class NoteService {
    private readonly storageDir = path.join(app.getPath('userData'), 'notes');

    constructor(
        private readonly downloader: UniversalDownloader,
        private readonly videoProcessor: VideoProcessor,
        private readonly transcriber: Transcriber,
        private readonly llmService: LLMService
    ) {
        fs.ensureDirSync(this.storageDir);
    }

    async generateNote(
        videoUrl: string,
        style: string = 'detailed',
        formats: string[] = ['toc', 'summary'],
        options: { screenshot?: boolean, videoUnderstanding?: boolean } = {}
    ): Promise<string> {
        const taskId = Date.now().toString();
        const taskDir = path.join(this.storageDir, taskId);
        await fs.ensureDir(taskDir);

        try {
            // 1. Get subtitles or transcribe
            let transcriptText = await this.downloader.getSubtitles(videoUrl, taskDir);
            let audioPath: string | null = null;
            let videoPath: string | null = null;

            if (!transcriptText) {
                const downloadResult = await this.downloader.downloadAudio(videoUrl, taskDir);
                audioPath = downloadResult.filePath;
                const transcript = await this.transcriber.transcribe(audioPath);
                transcriptText = transcript.text;
            }

            if (!transcriptText) {
                throw new Error('Failed to obtain transcript text');
            }

            // 2. Handle Video/Images if needed
            let images: string[] = [];
            if (options.screenshot || options.videoUnderstanding) {
                videoPath = await this.downloader.downloadVideo(videoUrl, taskDir);
                if (options.videoUnderstanding) {
                    const gridFiles = await this.videoProcessor.generateGridImage(videoPath, path.join(taskDir, 'grids'));
                    for (const f of gridFiles) {
                        const base64 = await this.fileToBase64(f);
                        images.push(`data:image/jpeg;base64,${base64}`);
                    }
                }
                // Note: screenshot mode usually requires timestamps from LLM or fixed points
                // In BiliNote, it's often a multi-turn process or fixed intervals
            }

            // 3. Summarize via LLM (Passing images if available)
            const prompt = this.buildPrompt(transcriptText, style, formats, options);
            const markdown = await this.llmService.completion(prompt); // LLMService should handle image-base64 in prompt if necessary

            // 4. Store result
            const resultPath = path.join(taskDir, 'note.md');
            await fs.writeFile(resultPath, markdown);

            return markdown;
        } catch (error) {
            console.error('Note generation failed:', error);
            throw error;
        }
    }

    private async fileToBase64(filePath: string): Promise<string> {
        const buffer = await fs.readFile(filePath);
        return buffer.toString('base64');
    }

    private buildPrompt(transcript: string, style: string, formats: string[], options: any): string {
        let prompt = `Please generate a ${style} video note based on the following transcript. 
        Include: ${formats.join(', ')}.`;

        if (options.videoUnderstanding) {
            prompt += `\nI have provided grid images from the video to help you understand the visual content. Please correlate the visual information with the transcript.`;
        }

        prompt += `\n\nTranscript:\n${transcript}`;
        return prompt;
    }
}
