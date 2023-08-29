import * as nest from '@nestjs/common';
import {BlogDto} from "./dto/blog.dto";

function defaultParam(defaultParams?: any[]) {
    return (target: any, propName: string, descriptor: PropertyDescriptor) => {
        const originFn = descriptor.value;

        descriptor.value = (...realParams: any[]) => {
            console.log("params: " + JSON.stringify(realParams));
            // return Reflect.apply(target, propName, realParams);
            return originFn.call(this, ...realParams);
        }
    };
}

interface BlogListQueries extends Object {
    p?: number
}

@nest.Controller('blog')
export class BlogController {

    @nest.Get(["", "index"])
    // @Redirect("/blog/list")
    async blogIndex() {
        return await new Promise((resolve) => {
            setTimeout(() => {
                resolve("Blog Index OK.")
            }, 1000);
        });
    }

    @nest.Get("list")
    // @defaultParam()
    async blogList(@nest.Query() query: BlogListQueries = {}) {
        return "Get the blog list";
    }

    @nest.Get("static/:blogNumber")
    getStaticDetail(@nest.Param("blogNumber") blogNumber: string) {
        return `Get the blog by id ${blogNumber}`;
    }

    @nest.Get("detail")
    getBlogDetail(@nest.Query("id") blogId: BlogDto.BlogId) {
        return `get blog by blogId is: ${blogId}`;
    }

    @nest.Post()
    addBlog(@nest.Body() {author}: BlogDto.CreateBlog) {
        return `Add a new blog with author ${author}`;
    }

    @nest.Put(":blogId")
    updateBlogDetail(@nest.Param("blogId") blogId: BlogDto.BlogId) {
        return `Start edit blog with id ${blogId}`;
    }

    @nest.Delete(":blogId")
    deleteBlogDetail(@nest.Param("blogId") blogId: BlogDto.BlogId) {
        return `Gone to delete blog with id ${blogId}`;
    }
}
