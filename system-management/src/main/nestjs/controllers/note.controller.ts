import { Controller, Post, Body, Get, Param, Delete } from '@nestjs/common';
import { NoteService } from '../services/note.service';
import { v4 as uuidv4 } from 'uuid';

@Controller('api/note')
export class NoteController {
    private tasks = new Map<string, any>();

    constructor(private readonly noteService: NoteService) { }

    @Post('generate')
    async generate(@Body() body: { video_url: string; style?: string; formats?: string[] }) {
        const taskId = uuidv4();
        this.tasks.set(taskId, { status: 'PROCESSING' });

        // Run in background
        this.noteService.generateNote(body.video_url, body.style, body.formats)
            .then(markdown => {
                this.tasks.set(taskId, { status: 'SUCCESS', markdown });
            })
            .catch(error => {
                this.tasks.set(taskId, { status: 'FAILED', error: error.message });
            });

        return { code: 200, data: { task_id: taskId } };
    }

    @Get('status/:id')
    getStatus(@Param('id') id: string) {
        const task = this.tasks.get(id);
        if (!task) return { code: 404, message: 'Task not found' };
        return { code: 200, data: task };
    }

    @Get(':id')
    getResult(@Param('id') id: string) {
        const task = this.tasks.get(id);
        if (!task || task.status !== 'SUCCESS') {
            return { code: 404, message: 'Result not ready or not found' };
        }
        return { code: 200, data: task };
    }

    @Delete(':id')
    deleteTask(@Param('id') id: string) {
        this.tasks.delete(id);
        return { code: 200, message: 'Task deleted' };
    }
}
