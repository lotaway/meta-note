import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { setSessionToken } from '../../desktop-chatgpt';
import { setDeepSeekSessionToken } from '../../desktop-deepseek';

@Controller('v1/auth/token')
export class AuthController {
    @Post()
    handleToken(@Body() payload: { token: string; model?: string }) {
        const { token, model = 'chatgpt' } = payload;

        if (!token) {
            throw new HttpException({ error: 'Missing token' }, HttpStatus.BAD_REQUEST);
        }

        if (model === 'chatgpt') {
            setSessionToken(token);
        } else if (model === 'deepseek') {
            setDeepSeekSessionToken(token);
        } else {
            throw new HttpException({ error: 'Unsupported model' }, HttpStatus.BAD_REQUEST);
        }

        console.log(`[API] Received session token for ${model} from external source`);
        return { status: 'success', model };
    }
}
