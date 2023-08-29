import * as nest from "@nestjs/common";
import {UserController} from "./user.controller";
import {UserService} from "./user.service";
import {ValidUserMiddleware} from "../../common/middleware/valid-user.middleware";

@nest.Module({
    controllers: [UserController],
    providers: [UserService]
})
export class UserModule implements nest.NestModule {
    configure(consumer: nest.MiddlewareConsumer) {
        consumer.apply(ValidUserMiddleware).forRoutes({
            path: "user/index",
            method: nest.RequestMethod.GET
        });
        consumer.apply(ValidUserMiddleware).forRoutes({
            path: "user/blog",
            method: nest.RequestMethod.GET
        });
    }
}
