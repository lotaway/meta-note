const gulp = require('gulp')
    , connect = require('gulp-connect')
    , proxy = require('http-proxy-middleware')
    , getLocalIp = require('./tools/getLocalIp')
    , open = require('open')
    , childProcess = require("child_process")
    , walker = require("./tools/walker")
    , path = require("path")
    // , path = require("path")
;

/*从命令行传递参数
// npm install --save-dev gulp gulp-if gulp-uglify minimist

var gulp = require('gulp');
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify');
var minimist = require('minimist');
var knownOptions = {
    string: 'env',
    default: { env: process.env.NODE_ENV || 'production' }
};
var options = minimist(process.argv.slice(2), knownOptions);

gulp.task('scripts', function() {
    return gulp.src('**!/!*.js')
        .pipe(gulpif(options.env === 'production', uglify())) // 仅在生产环境时候进行压缩
        .pipe(gulp.dest('dist'));
});*/

function shopBest(filePathPrevFix, {sitePort, programSlnName, vsPath, sitePath, templatePath, openPath = ""}) {
    let port = 3003
        , mobilePathPrefix = `${filePathPrevFix + sitePath + templatePath}`
        , programPathPrefix = `${filePathPrevFix}/**`
        , staticCodePath = [
            `${mobilePathPrefix}/**/*.{html,css,js}`,
            `${filePathPrevFix + sitePath}/config/public/*.xml`,
            `${filePathPrevFix + sitePath}/scripts/*.js`
        ]
        , programCodePath = [
            "!" + programPathPrefix + "/*.aspx.designer.cs"
            , programPathPrefix + "/*.cs"
        ]
        , packagePath = [
            `${filePathPrevFix}/Micronet.Mvc/bin/*.dll`
        ]
        , fleshTimer
    ;

    gulp.task('开启代理服务器', function (done) {
        const host = getLocalIp();

        connect.server({
            host,
            port,
            livereload: true,
            middleware: function (connect, opt) {
                return [
                    proxy('/mock', {
                        target: 'http://www.sosoapi.com/pass/mock/dynamic/7471/',
                        changeOrigin: false
                    }),
                    proxy('/', {
                        target: `http://${host}:${sitePort}/`,
                        changeOrigin: false
                    })
                ];
            }
        });
        open(`http://${host}:${port}${openPath}`);
        done();
    });

    gulp.task("程序编译", function (done) {
        if (!programSlnName) {
            console.log("正在查找编译文件路径");
            try {
                const result = walker(filePathPrevFix, {
                    ext: ["sln"],
                    deep: false
                })[0].split("\\");

                programSlnName = result[result.length - 1];
                console.log("编译入口路径：" + programSlnName);
            } catch (e) {
                console.log("找不到编译入口文件：" + JSON.stringify(e));
                return done();
            }
        }
        childProcess.exec(`devenv ${filePathPrevFix.replace("/", "\\")}\\${programSlnName} /build Release`, {
            cwd: vsPath
        }, function (err, stdout, stderr) {
            if (err) {
                console.error("执行命令出错：" + err);
            }
            done();
        });
    });

    gulp.task("刷新浏览器", function (done) {
        fleshTimer !== undefined && clearTimeout(fleshTimer);
        fleshTimer = setTimeout(function () {
            // connect.reload();
            gulp.src(staticCodePath).pipe(connect.reload());
            done();
        }, 1000);
    });

    /*gulp.task("监听并刷新", function () {
        gulp.src(staticCodePath.concat(packagePath)).pipe(connect.reload());
    });*/

    gulp.task("监听模板改动", function (done) {
        gulp.watch(staticCodePath, gulp.parallel(["刷新浏览器"]), function (done) {
            done();
        });
        done();
    });

    gulp.task("监听包文件改动", function (done) {
        gulp.watch(packagePath, gulp.parallel(["刷新浏览器"]), function (done) {
            done();
        });
        done();
    });

    gulp.task("监听程序改动", function (done) {
        gulp.watch(programCodePath, gulp.parallel(["程序编译"]), function (done) {
            done();
        });
        done();
    });

    gulp.task("default", gulp.parallel(["开启代理服务器", "监听模板改动", "监听包文件改动", "监听程序改动"/*, "监听并刷新"*/], function (done) {
        done();
    }));
}

module.exports = shopBest;