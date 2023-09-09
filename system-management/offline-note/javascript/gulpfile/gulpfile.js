const shopBest = require("./gulpfile.shopbest.js")
    , vsPath = "D:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Community\\Common7\\Tools\\LaunchDevCmd.bat"
    // , templatePath = "/templates/mobi/DepartStore"
    , templatePath = "/templates/mobi/DepartStore"
    , sitePath = "/Micronet.Mvc"
;

shopBest("E:/workspace/project/ShopBest", {
    sitePort: 10010,
    vsPath,
    sitePath: sitePath,
    templatePath,
    openPath: "/mobi/MN1/index.html"
});
/*
shopBest("E:/workspace/project/MicronetMvc_wyh/trunk", {
    sitePort: 10031,
    vsPath,
    sitePath: sitePath,
    templatePath,
    openPath: "/mobi/scanCode/pay/index"
});*/

/*
shopBest("E:/workspace/project/MicronetMvc_yggy/trunk", {
    sitePort: 10019,
    vsPath,
    sitePath: sitePath,
    templatePath,
    openPath: "/mobi/MN1/index.html"
});
*/
