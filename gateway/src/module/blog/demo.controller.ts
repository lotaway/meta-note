import * as nest from "@nestjs/common";
import {DemoService} from "./demo.service";

function useLogger(): MethodDecorator {
    console.log("compile: " + JSON.stringify(arguments));
    return (object, property, descriptor: PropertyDescriptor) => {
        console.log("define:" + object.constructor + ", property: " + property.toString() + ", descriptor: " + descriptor);
        const method = descriptor.value;
        descriptor.value = function (...args) {
            console.log("call:" + JSON.stringify(args));
            return method.call(this, ...args).then((...args) => {
                console.log('return: ' + JSON.stringify(args));
                return args;
            });
        }
    }
}

enum Router {
    all = "all"
}

@nest.Controller("demo")
export class DemoController {

    constructor(private readonly demoService: DemoService) {
    }

    @nest.Get(["", Router.all])
    @nest.Render(`demo/${Router.all}`)
    webComponent() {
        return {};
    }

    @nest.Get("user/all")
    async getAllUsers() {
        return await this.demoService.getAllUsers()
    }

    @nest.Get("file/:fileName")
    // @useLogger()
    async getMarkDownFile(@nest.Param("fileName") fileName) {
        return await this.demoService.getFileByName(fileName)
    }

}
