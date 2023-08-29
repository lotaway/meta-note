const puppeteer = require("puppeteer")
    , path = require("path")
    // , shell = require('shelljs')
    // , tesseract = require('node-tesseract')
;

const chromiumPath = "D:/Program Files/chromium/chrome.exe"
const host = "http://test.8248.net"
    , frontUrl = `/cn/center/member`
    , backstage = {
        account: "weidaoming",
        password: "123123",
        nickname: "明"
    }
;

(async () => {
    const browser = await puppeteer.launch({
        // executablePath: chromiumPath,
        // devtools: true,
        headless: false
    })
    const page = await browser.newPage()
    const response = await page.goto(host + frontUrl, {
        // waitUntil: "domcontentloaded"
    })
    if (response.url().indexOf("/cn/login/web.html") > -1) {
        const accountEle = await page.waitForSelector("#user-account")
        await accountEle.type(backstage.account, {
            // delay: 24
        })
        const passwordEle = await page.$("#user-password")
        await passwordEle.type(backstage.password, {
            // delay: 24
        })
        const btnSubmit = await page.$(".contain-password-sign-in .btn-submit")
        await btnSubmit.click()
        /*const result = await loginPage.evaluate(() => {
            document.querySelector(".contain-password-sign-in .btn-submit").click();
        })*/
        /*await loginPage.click("#view-user-sign-in .btn-submit", {
            delay: 1000
        })*/
    }
    // await loginPage.waitForXPath(frontUrl)
    await page.waitForNavigation()
    const memberEle = await page.$(".Lmember")
    const textContent = await memberEle.getProperty("innerHTML")
    console.log(textContent.toString())
    if (textContent.toString().indexOf(backstage.nickname) > -1) {
        console.log("登录成功");
    } else {
        console.log("无法登录");
    }
    console.log("执行截图...");
    await page.screenshot({
        path: path.join(__dirname, "./screenshot.jpeg"),
        type: "jpeg",
        quality: 100,
        /*clip: {
            x: loginContent.offsetLeft + txtCheckCode.offsetLeft,
            y: loginContent.offsetTop + txtCheckCode.offsetTop,
            width: txtCheckCode.offsetWidth || txtCheckCode.width || 100,
            height: txtCheckCode.offsetHeight || txtCheckCode.height || 50
        }*/
    });
    // await shell.exec("convert 1.jpg -colorspace gray -normalize -threshold 50% 1.tif");
    // await shell.exec("tesseract 1.tif result");
    // await txtCheckCode.type("");
    // await page.press("Enter");
    await browser.close();
})();