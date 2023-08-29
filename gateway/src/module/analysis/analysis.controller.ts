import * as nest from "@nestjs/common";

@nest.Controller("analysis")
export class AnalysisController {

    @nest.Get(["blog", "blog/all"])
    getCreatorBlogAnalysis() {
        return "get creator blog analysis.";
    }

}
