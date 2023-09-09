// [模仿Nestjs控制器-路由-参数的元数据+装饰器写法](https://github.com/liam61/blog/tree/master/server/ts-decorator/demo/02use-metadata)
import express from "express";
import {
    Controller,
    Get,
    Post,
    Query,
    Header,
    Body,
    Parse,
    ParseType,
    ControllerRegister
} from "./reflect-metadata-library";

//  关键在于利用参数装饰器收集形参类型和顺序，之后通过类装饰器和实例方法装饰器在传入实参后按照收集的要求重新排列。

// 3）使用装饰器
@Controller('/')
export default class Index {
    @Get('/')
    index(@Parse(ParseType.Number) @Query('id') id: number) { // 装饰参数
        return {code: 200, id, message: 'success'};
    }

    @Post('/login')
    login(
        @Header('authorization') auth: string,
        @Body() body: { name: string; password: string },
        @Body('name') name: string,
        @Body('password') psd: string,
    ) {
        console.log(body, auth);
        if (name !== 'lawler' || psd !== '111111') {
            return {code: 401, message: 'auth failed'};
        }
        return {code: 200, token: 't:111111', message: 'success'};
    }
}

//  在app里引用完成所有路由的注册
// import Index from "./controller/index";
const app = express();
ControllerRegister({
    indexController: new Index()
}, "/", app);