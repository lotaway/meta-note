import { HttpStatus } from '@nestjs/common'
import { StudyService } from '../services/study.service'

export class StudyController {
    constructor(private readonly studyService: StudyService) { }

    async handleRequest(payload: any): Promise<any> {
        const { platform, target, targetType, studyType } = payload

        if (!platform || !target || !targetType || !studyType) {
            return { status: HttpStatus.BAD_REQUEST, error: 'Missing required fields' }
        }

        const limitReached = await this.studyService.checkLimitCount()
        if (limitReached) {
            return { status: HttpStatus.FORBIDDEN, error: 'Daily study limit reached' }
        }

        try {
            await this.studyService.addTask(payload)
            return { success: true, message: 'Study task added to queue' }
        } catch (err: any) {
            console.error('[Study API] Error:', err)
            return { status: HttpStatus.INTERNAL_SERVER_ERROR, error: String(err) }
        }
    }
}