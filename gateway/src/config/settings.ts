import * as path from "path";
import {cpus} from "os";

export default {
    PORT: 30001,
    PROCESS_MAX_COUNT: cpus().length / 2,
    PROJECT_DIR: path.join(__dirname, "../../")
}
