let fs = require('fs')
    , path = require('path')
    , zipper = require('zip-local')
;

const targetDirect = "E:/workspace/download/"
    , projectInclude = [
        "temp"
    ]
    , fileExclude = [
        ".idea"
    ]
;

// zipper.sync.zip("E:/workspace/download/cid.txt").compress().save(path.join(__dirname, "./1.zip"));

function goZip(fileNames) {
    if (!fileNames.length) return Promise.resolve()
    const fileName = fileNames.shift()
        , targetFile = path.join(targetDirect, fileName)
    return (new Promise(function (resolve, reject) {
        fs.stat(targetFile, function (err, ele) {
            if (err) {
                return reject(err)
            }
            if (ele.isFile()) {
                return resolve(fileNames)
            }
            let patches = targetFile.split("\\")
            // console.log(JSON.stringify(patches))
            if (!projectInclude.includes(patches[patches.length - 1]) || fileExclude.includes(patches[patches.length - 1])) {
                return resolve(fileNames)
            }
            console.log(`${targetFile}符合条件，正在打包...`)
            zipper.zip(targetFile, (error, zipExport) => {
                if (error) {
                    return reject({
                        tip: "压缩过程出错",
                        error
                    })
                }
                let savePath = path.join(__dirname, `./${fileName}.zip`)
                console.log(`打包保存路径：${savePath}`)
                zipExport.compress().save(savePath, error => {
                    if (error) {
                        return reject({
                            tip: "压缩保存出错",
                            error
                        })
                    }
                    console.log(`压缩保存完成`)
                    resolve(fileNames)
                });
            });
        });
    })).then(paths => goZip(paths));
}

fs.readdir(targetDirect, {encoding: "utf-8"}, (error, files) => {
    if (error) return console.log(error)
    goZip(files)
        .then(result => {
            console.log(`打包文件完成：${result}`)
        })
        .catch(error => console.log(`打包文件出错：${error}`))
    console.log("正在打包文件")
});
console.log("正在读取文件")