import {Express, Router, Request, Response} from "express";
import "reflect-metadata";

// 1）定义装饰器
export const CONTROLLER_METADATA = 'controller';
export const ROUTE_METADATA = 'method';
export const PARAM_METADATA = 'param';
export const PARSE_METADATA = "parse";

export enum HttpMethod {
    Get = "get",
    Post = "post",
    Put = "put",
    Delete = "delete",
    Patch = "patch"
}

export enum ParamType {
    Query = "query",
    Body = "body",
    Header = "headers",
    Parse = "parse"
}

export enum ParseType {
    Number = 'number',
    String = 'string',
    Boolean = 'boolean'
}

export type TParam = {
    key: string
    index: number
    type: string
}
export type TParse = {
    name: string
    index: number
    type: string
}
export type TRoute = {
    type: string
    path: string
};

export function Controller(path = ''): ClassDecorator {
    return (target: object) => {
        Reflect.defineMetadata(CONTROLLER_METADATA, path, target);
    };
}

export function createMethodDecorator(method: HttpMethod | ParamType = HttpMethod.Get) {
    return (path = '/'): MethodDecorator => (target: object, name: string, descriptor: any) => {
        Reflect.defineMetadata(ROUTE_METADATA, {type: method, path}, descriptor.value);
    };
}

export function createParamDecorator<Key = string>(type: ParamType) {
    return (key?: Key): ParameterDecorator => (target: object, name: string, index: number) => {
        // 这里要注意这里defineMetadata挂在target.name上，但该函数的参数有顺序之分，下一个装饰器定义参数后覆盖之前的，所以要用preMetadata保存起来
        const preMetadata = Reflect.getMetadata(PARAM_METADATA, target, name) || [];
        const newMetadata = [{key, index, type}, ...preMetadata];
        Reflect.defineMetadata(PARAM_METADATA, newMetadata, target, name);
    };
}

// 使用
export const Get = createMethodDecorator(HttpMethod.Get);
export const Post = createMethodDecorator(HttpMethod.Post);
export const Put = createMethodDecorator(HttpMethod.Put);
export const Delete = createMethodDecorator(HttpMethod.Delete);
export const Patch = createMethodDecorator(HttpMethod.Patch);
export const Query = createParamDecorator(ParamType.Query);
export const Body = createParamDecorator(ParamType.Body);
export const Header = createParamDecorator(ParamType.Header);
export const Head = Header;
export const Parse = createParamDecorator<ParseType>(ParamType.Parse);

// 2）装饰器注入
export const ControllerRegister = (controllerStore, rootPath: string, app: Express) => {
    const router = Router();
    Object.values(controllerStore).forEach(instance => {
        const controllerMetadata: string = Reflect.getMetadata(CONTROLLER_METADATA, instance.constructor);
        const proto = Object.getPrototypeOf(instance);
        // 拿到该实例的原型方法
        const routeNameArr = Object.getOwnPropertyNames(proto).filter(
            n => n !== 'constructor' && typeof proto[n] === 'function',
        );
        routeNameArr.forEach(routeName => {
            const routeMetadata: TRoute = Reflect.getMetadata(ROUTE_METADATA, proto[routeName]);
            const {type, path} = routeMetadata;
            const handler = handlerFactory(
                proto[routeName],
                Reflect.getMetadata(PARAM_METADATA, instance, routeName),
                Reflect.getMetadata(PARSE_METADATA, instance, routeName),
            );
            router[type](controllerMetadata + path, handler);
        });
    });
    // return router;
    app.use(rootPath, router);
}
declare type NextFunction = Function;

// 路由处理函数工厂
export function handlerFactory(func: (...args: any[]) => any, paramList: TParam[], parseList: TParse[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // 获取路由函数的参数
            const args = extractParameters(req, res, next, paramList, parseList);
            const result = await func(...args);
            res.send(result);
        } catch (err) {
            next(err);
        }
    };
}

// 根据 req 处理装饰的结果
export function extractParameters(req: Request, res: Response, next: NextFunction, paramArr: TParam[] = [], parseArr: TParse[] = [],
) {
    if (!paramArr.length) return [req, res, next];
    const args = [];
    // 进行第三层遍历
    paramArr.forEach(param => {
        const {key, index, type} = param;
        // 获取相应的值，如 @Query('id') 则为 req.query.id
        switch (type) {
            case ParamType.Query:
                args[index] = key ? req.query[key] : req.query;
                break;
            case ParamType.Body:
                args[index] = key ? req.body[key] : req.body;
                break;
            case ParamType.Header:
                args[index] = key ? req.headers[key.toLowerCase()] : req.headers;
                break;
            // ...
        }
    });
    // 小优化，处理参数类型
    parseArr.forEach(parse => {
        const {type, index} = parse;
        switch (type) {
            case ParseType.Number:
                args[index] = +args[index];
                break;
            case ParseType.String:
                args[index] = args[index] + '';
                break;
            case ParseType.Boolean:
                args[index] = Boolean(args[index]);
                break;
        }
    });
    args.push(req, res, next);
    return args;
}