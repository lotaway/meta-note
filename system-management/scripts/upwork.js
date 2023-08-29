/**
 * 网络爬虫，简单获取页面内容 2016/5/8.
 */
const puppeteer = require('puppeteer')
const https = require("https")
const {join} = require("path")
const {createWriteStream} = require("fs")
const cheerio = require('cheerio')
const targetUrl = 'https://www.upwork.com/nx/find-work/'

function htmlStrToJson(htmlStr) {
    const $ = cheerio.load(htmlStr)
    let jsonArr = []
    console.log($.html())
    const jobList = $("section.up-card-list-section")
    jobList.each(index => {
        const item = $(this)
        const titleNode = item.find(".job-tile-title")
        const link = `${targetUrl}${titleNode.children("a").attr("href")}`
        const title = titleNode.text()
        const desc = item.find(".job-description-text").text()
        const jobType = item.find('[data-test="job-type"]').text()
        const budget = item.find('[data-itemprop="baseSalary"]').text()
        jsonArr.push({
            title, desc, link, jobType, budget
        })
    })
    return jsonArr
}

async function saveData(dataJson) {
    console.log(dataJson)
    return await new Promise(resolve => {
        const writeStream = createWriteStream(join(__dirname, "./download.json"))
        writeStream.write(JSON.stringify(dataJson), (err) => {
            if (err) throw err
            console.log("done")
        })
        writeStream.on("finish", () => {
            writeStream.close()
            resolve()
        })
    })
}

async function testPage() {
    const browser = await puppeteer.launch({
        headless: false
    })
    const page = await browser.newPage()
    const response = await page.goto(targetUrl)
    if (response.url().indexOf("account-security/login") > -1) {
        //  需要登录
        const usernameNode = await page.$("#login_username")
        await usernameNode.type("576696294@qq.com", {delay: 16})
    }
    //  todo 这一步拿不到内容，因为实际上页面上的内容还没有这些
    const jobList = await page.waitForSelector("section.up-card-list-section")
    if (!jobList) throw new Error("jobList not exist")
    console.log(await jobList.jsonValue())
    let jsonArr = []
    for (let jobItem of jobList) {
        const titleNode = await jobItem.$(".job-tile-title")
        const title = await titleNode.getProperty("innerText")
        const link = await titleNode.$("a").getProperty("href")
        const desc = await jobItem.$(".job-description-text").getProperty("innerText")
        const jobType = await jobItem.$('[data-test="job-type"]').getProperty("innerText")
        const budget = await jobItem.$('[data-itemprop="baseSalary"]')
        jsonArr.push({
            title, desc, link, jobType, budget
        })
    }
    await saveData(jsonArr)
    await browser.close()
}

testPage().then(() => {
    console.log("done")
})

/*
https
    .get(targetUrl, (res) => {
        let htmlStr = "";
        res.on('data', chunk => htmlStr += chunk)
        res.on('end', () => {
            saveData(htmlStrToJson(htmlStr))
        })
        res.on("error", err => {
            console.error(err)
        })
    })
    .on('error', () => console.log('catch error'))*/
