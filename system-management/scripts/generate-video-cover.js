//  视频画面截图，涉及第三方命令行工具：http://ffmpeg.org/

const path = require("path")
    , childProcess = require("child_process")

console.log("in，经测试开启命令行直接调用可以用，但在如webstorm开发工具内置命令行里调用是失败的，权限导致？")
// ffmpeg -ss 00:00:01 -i E:\workspace\download\temp\正常.mp4 -f image2 -vframes 1 -y ./testImg%d.jpg

childProcess.exec("ffmpeg -ss 00:00:01 -i E:/workspace/download/temp/正常.mp4 -f image2 -vframes 1 -y ./testImg%d.jpg", function (err) {
    if (err) {
        console.log("got an error：" + err)
    } else {
        console.log("success")
    }
});
console.log("out")