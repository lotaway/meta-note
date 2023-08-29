import * as nest from "@nestjs/common";
import {Request, Response, NextFunction} from "express";

const allUserComeFromDB = [];

@nest.Injectable()
export class ValidUserMiddleware implements nest.NestMiddleware {

    use(req: Request, res: Response, next: NextFunction) {
        const userId = req.params.userId;
        const isExist = allUserComeFromDB.some(item => item.id === userId);
        if (!isExist) {
            throw new nest.HttpException("Didn't find match user.", 400);
        }
        next();
    }

}
