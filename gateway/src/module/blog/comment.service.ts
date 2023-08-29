import * as nest from "@nestjs/common";
import {BlogDto} from "./dto/blog.dto";
import {nanoid} from "nanoid";

@nest.Injectable()
export class CommentService {
    comments: BlogDto.BlogComment[] = []

    getCommentsByBlogId(blogId: BlogDto.BlogId) {
        return this.comments.filter(item => item.blogId === blogId);
    }

    getCommentById(commendId: BlogDto.CommentId) {
        return this.comments.find(item => item.id === commendId);
    }

    addBlogComment(payload: Omit<BlogDto.BlogComment, "id">) {
        const finalData = {
            // id: crypto.randomUUID(),
            id: nanoid(),
            ...payload
        };
        this.comments.push(finalData);
        return true;
    }

}
