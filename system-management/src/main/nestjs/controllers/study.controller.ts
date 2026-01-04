import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { StudyService } from '../services/study.service';

@Controller('api/study')
export class StudyController {
    constructor(private readonly studyService: StudyService) { }

    @Post('request')
    async handleRequest(@Body() payload: any) {
        const { platform, target, targetType, studyType } = payload;

        if (!platform || !target || !targetType || !studyType) {
            throw new HttpException({ error: 'Missing required fields' }, HttpStatus.BAD_REQUEST);
        }

        const limitReached = await this.studyService.checkLimitCount();
        if (limitReached) {
            throw new HttpException({ error: 'Daily study limit reached' }, HttpStatus.FORBIDDEN);
        }

        try {
            await this.studyService.addTask(payload);
            return { success: true, message: 'Study task added to queue' };
        } catch (err: any) {
            console.error('[Study API] Error:', err);
            throw new HttpException({ error: String(err) }, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
