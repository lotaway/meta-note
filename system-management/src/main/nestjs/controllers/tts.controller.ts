import { Controller, Post, Body, Get, Res, Header } from '@nestjs/common';
import { TTSService } from '../services/tts.service';
import type { Response } from 'express';

@Controller('api/tts')
export class TTSController {
    constructor(private readonly ttsService: TTSService) { }

    @Post('synthesize')
    @Header('Content-Type', 'audio/mpeg')
    async synthesize(@Body() body: { text: string; voice_profile_id: string }, @Res() res: Response) {
        if (!body.text || !body.voice_profile_id) {
            return res.status(400).json({ code: 400, message: 'Text and voice_profile_id are required' });
        }

        try {
            const audioBuffer = await this.ttsService.synthesize(body.text, body.voice_profile_id);
            res.send(audioBuffer);
        } catch (error: any) {
            res.status(500).json({ code: 500, message: error.message });
        }
    }

    @Get('status')
    async getStatus() {
        const status = await this.ttsService.getModelStatus();
        return {
            code: 200,
            data: status
        };
    }

    @Post('download')
    async download() {
        await this.ttsService.downloadModel();
        return {
            code: 200,
            message: 'Model downloaded successfully'
        };
    }
}
