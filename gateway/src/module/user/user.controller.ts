import * as nest from '@nestjs/common';
import {UserService} from "./user.service";
//  验证码
import svgCaptcha from "svg-captcha";
import {UserDto} from "./dto/user.dto";

@nest.Controller('user')
export class UserController {

    constructor(private readonly userService: UserService) {
    }

    @nest.Post("signIn")
    async signIn(@nest.Param() {username, password}: UserDto.Controller.SignInParam, @nest.Res() res) {
        if (!username || !password) {
            res.status = 403;
            res.message = "缺少参数";
        }
        const result = await this.userService.signIn({username, password});
        res.status = 200;
        res.data = result;
        // process.nextTick(this.userService.checkS)
    }

    @nest.Get(["", "index"])
    @nest.Render("user/index")
    index(@nest.Req() req, @nest.Res() res) {
        res.cookie("timestamp", +new Date().toString());
        return {welcome: "Hello User.", cookies: req.cookies};
    }

    @nest.Get(["blog", "blog/all"])
    getUserBlog(@nest.Req() req) {
        const blogCount = this.userService.getUserBlogCount();
        return {
            blog: {
                tip: `Get the log in user's blogs, you already publish ${blogCount} blogs!`,
                count: blogCount
            }
        };
    }

}
