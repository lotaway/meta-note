/**
 * 读取会员菜单文件获取菜单名称（包含子菜单）
 */
const fs = require("fs")
    , path = require("path")
    , xml2js = require("xml2js")
    , projectRootPath = require("./projectRootPath").shopbest.root
    , outputFile = path.join(__dirname, "./getMenuName.txt")
    ;

let fileData = fs.readFileSync(path.join(projectRootPath, "Micronet.Mvc/templates/mobi/MN031/config/menu.xml"), {
    encoding: "utf8"
})
    //  xml to json
    , xmlParser = new xml2js.Parser({
        explicitArray: false,
        ignoreAttrs: true
    })
    ;

xmlParser.parseString(fileData, (error, result) => {
    if (error) {
        throw new Error("parseError:" + error)
    }
    let nameArr = []
        //  读取并存储名称
        , getName =
            obj => {
                const attrName = "MenuInfo"

                if (obj.hasOwnProperty(attrName)) {
                    obj[attrName].forEach(item => {
                        const childAttrName = "ChildMenuInfo"

                        if (nameArr.indexOf(item.Name) === -1)
                            nameArr.push(item.Name)
                        if (item.hasOwnProperty(childAttrName))
                            getName(item[childAttrName])
                    })
                }
            }
        ;
    try {
        getName(result.ArrayOfMenuInfo);
        // console.log(nameArr);
        fs.writeFile(outputFile, nameArr.join("\n"), {
            encoding: "utf8"
        }, function (error, result) {
            if (error) throw new Error("write error:" + error);
            console.log("write success:" + result);
        })
    }
    catch (e) {
        console.log(e);
    }
});