import { TTSService } from '../services/tts.service';
import * as express from 'express';

export class TTSController {
    constructor(private readonly ttsService: TTSService) { }

    async synthesize(req: express.Request, res: express.Response) {
        const body = req.body;
        if (!body.text || !body.voice_profile_id) {
            return res.status(400).json({ code: 400, message: 'Text and voice_profile_id are required' });
        }

        try {
            const audioBuffer = await this.ttsService.synthesize(body.text, body.voice_profile_id);
            res.setHeader('Content-Type', 'audio/mpeg');
            res.send(audioBuffer);
        } catch (error: any) {
            res.status(500).json({ code: 500, message: error.message });
        }
    }

    async getStatus(req: express.Request, res: express.Response) {
        const status = await this.ttsService.getModelStatus();
        res.json({
            code: 200,
            data: status
        });
    }

    async download(req: express.Request, res: express.Response) {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no'
        });

        const subscription = this.ttsService.downloadModel().subscribe({
            next: (event) => {
                res.write(`data: ${JSON.stringify(event.data)}\n\n`);
            },
            error: (err) => {
                res.write(`data: ${JSON.stringify({ status: 'error', message: err.message })}\n\n`);
                res.end();
            },
            complete: () => {
                res.write(`data: ${JSON.stringify({ status: 'success', progress: 100 })}\n\n`);
                res.end();
            }
        });

        req.on('close', () => {
            subscription.unsubscribe();
        });
    }

    async delete(req: express.Request, res: express.Response) {
        await this.ttsService.deleteModel();
        res.json({
            code: 200,
            message: 'Model deleted successfully'
        });
    }
}
