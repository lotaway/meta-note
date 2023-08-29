import * as nest from '@nestjs/common';

@nest.Injectable()
export class AppService {
    getHello(): string {
        return 'Hello World!';
    }
}
