import { HttpStatus } from '@nestjs/common'
import * as express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { NoteService } from '../services/note.service'

interface GenerateNoteBody {
    video_url: string
    style?: string
    formats?: string[]
    options?: { screenshot?: boolean, videoUnderstanding?: boolean }
}

interface NoteTask {
    status: 'PROCESSING' | 'SUCCESS' | 'FAILED'
    markdown?: string
    error?: string
}

export class NoteController {
    private readonly tasks = new Map<string, NoteTask>()

    constructor(private readonly noteService: NoteService) { }

    generate(req: express.Request, res: express.Response) {
        const { video_url, style, formats, options } = req.body as GenerateNoteBody
        if (!video_url) {
            res.status(HttpStatus.BAD_REQUEST).json({ code: 400, message: 'Missing video_url' })
            return
        }
        const taskId = uuidv4()
        this.tasks.set(taskId, { status: 'PROCESSING' })
        this.runGeneration(taskId, video_url, style, formats, options)
        res.json({ code: 200, data: { task_id: taskId } })
    }

    getStatus(req: express.Request, res: express.Response) {
        const task = this.tasks.get(String(req.params.id))
        if (!task) {
            res.status(HttpStatus.NOT_FOUND).json({ code: 404, message: 'Task not found' })
            return
        }
        res.json({ code: 200, data: task })
    }

    getResult(req: express.Request, res: express.Response) {
        const task = this.tasks.get(String(req.params.id))
        if (!task || task.status !== 'SUCCESS') {
            res.status(HttpStatus.NOT_FOUND).json({ code: 404, message: 'Result not ready or not found' })
            return
        }
        res.json({ code: 200, data: task })
    }

    deleteTask(req: express.Request, res: express.Response) {
        this.tasks.delete(String(req.params.id))
        res.json({ code: 200, message: 'Task deleted' })
    }

    private runGeneration(
        taskId: string,
        videoUrl: string,
        style?: string,
        formats?: string[],
        options?: { screenshot?: boolean, videoUnderstanding?: boolean }
    ) {
        void this.noteService.generateNote(videoUrl, style, formats, options)
            .then(markdown => this.tasks.set(taskId, { status: 'SUCCESS', markdown }))
            .catch((error: Error) => this.tasks.set(taskId, { status: 'FAILED', error: error.message }))
    }
}
