import * as nest from '@nestjs/common';
import {AppService} from './app.service';

@nest.Controller()
export class AppController {
    constructor(private readonly appService: AppService) {
    }

    @nest.Get()
    getHello(): string {
        return this.appService.getHello();
    }
}
