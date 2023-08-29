import * as nest from "@nestjs/common";
import {BlogDto} from "./dto/blog.dto";
import {CommentService} from "./comment.service";

@nest.Controller("comment")
export class BlogCommentController {

    constructor(private readonly commentService: CommentService) {
    }

    @nest.Get("byBlog/:blogId")
    getCommentsByBlogId(@nest.Param() params: BlogDto.FindBlogCommentParams) {
        const comments = this.commentService.getCommentsByBlogId(params.blogId);
        return {
            blogId: params.blogId,
            comments
        };
    }

    @nest.Get("byId/:commentId")
    getCommentById(@nest.Param("commendId", new nest.ParseUUIDPipe()) commendId: BlogDto.CommentId) {

    }

    @nest.Post("byBlog")
    addBlogComment(@nest.Body() body: BlogDto.CreateBlogCommentParams, @nest.Res() res) {
        const now = new Date();
        const result = this.commentService.addBlogComment({
            ...body,
            createTime: now,
            updateTime: now
        });
        if (result) {
            res.state = 200;
        }
        return res;
    }

    @nest.Put(":blogId/:commendId")
    updateBlogComment() {
        return "Not allow edit comment twice!";
    }

    @nest.Delete()
    deleteBlogComment(@nest.Param() {commentId}) {
        return "delete blog comment by commentId";
    }

}
