@[TOC](前端测试-基础学习)

# 单元测试 Unit Test

单元测试主要通过模拟输入来确认一个函数或者类的输出值是否符合要求，非常适合测试底层方法是否兼顾灵活、可靠和错误处理，无论是前端还是后端都非常常见，线上算法试题网站里也使用了这种测试方式去验证用户的输入是否满足算法要求。
由于一次完成后就不需要经常改动，性价比非常高。

以下通过最常见的测试框架[Jest](https://jestjs.io/docs/en/getting-started)示例，另外一种常见的测试框架是Mocha+Chai

## 你的开发代码

```javascript
// @@classroom.js
export class ClassRoom {
    students: []

    addS(_students) {
        this.students = _students
    }
}
```

## 编写测试用例

```javascript
// @@Jest.config.js
const ClassRoom = require("classroom")
// test([测试用例名称],执行方法)
test("判断是否成功添加学生", () => {
    //  执行要测试的代码，通过模拟输入来获取到输出结果
    const arr = (new ClassRoom()).addS(["Tom", "Jelly", "Jam"]);
    let n;
    //  通过expect([结果表达式]).[要执行的断言方法]([参数]) 判断确定输出是否为想要的结果，若断言失败则会抛出错误，该语句即视为失败。
    //  判断结果为true，此处判断结果长度等于3是否为真
    expect(arr.length === 3).toBeTruthy();
    //  判断结果为false，此处判断结果类型为字符串是否为假
    expect(typeof arr === "string").toBeFalsy();
    //  判断是否相等，此处判断结果最后一项是否等于Jam（因为输出通过了前面的数组类型判断，所以可以放心将结果当做数组使用）
    expect(arr[arr.length - 1]).toBe("Jam");
    //  与上一例相反，判断是否不相等，此处判断结果倒数第二项是否不等于Jam
    expect(arr[arr.length - 2]).not.toBe("Jam");
    //  判断是否为null
    expect(null).toBeNull();
    //  判断是否为undefined，此处判断结果第3项是否为未定义
    expect(arr[3]).toBeUndefined();
    //  与上一例相反，判断是否已定义，此处判断结果是否为已定义
    expect(arr).toBeDefined();
    //  判断是否大于2，此处判断结果长度是否大于2
    expect(arr.length).toBeGreaterThan(2);
    //  判断是否大于等于3，此处判断结果长度是否大于等于3
    expect(arr.length).toBeGreaterThanOrEqual(3);
    //   判断是否小于5，此处判断结果长度是否小于5
    expect(arr.length).toBeLessThan(5);
    //  小于等于3，此处判断结果是否小于等于3
    expect(arr.length).toBeLessThanOrEqual(3);
    //  浮点数判断相等，此处判断结果+0.5后作为浮点数是否接近3.5
    expect(arr.length + 0.5).toBeCloseTo(3.5);
    //  通过正则判断，此处判断结果最后一项是否Ja字符开头
    expect(arr[arr.length - 1]).toMatch(/^Ja/);
    //  判断是否包含某项，此处判断结果是否包含Tom
    expect(arr).toContain('Tom');
});
```

# 集成测试 Integrate Test

集成测试通用用于一个小范围内的综合测试，例如测试一个React/Vue的组件是否输出相应的标签和内容，该方式要求必须同时深入业务和代码本身去完成，在前端迭代非常快和经常在完全不同的项目之间切换时，其代码性价比非常低，除非像是专门开发单个组件的项目，否则不建议使用。

# 端到端测试 E2E Test

端到端测试是用于测试实际用户使用网站的过程，一般可通过使用[puppeteer无头浏览器](https://github.com/puppeteer/puppeteer)
进行模拟用户浏览和输入行为。
puppeteer库会下载chromium浏览器作为测试用浏览器，如果已有Edge浏览器，可以转为引入puppeteer-core轻量库。
以下展示了puppeteer打开一个网页并进行截图保存后关闭页面：

```javascript
const puppeteer = require("puppeteer")
const {join} = require("path")

let host = "https://www.baidu.com";  //  要测试的页面访问路径

//  示例
async function testMainPage(host) {
    //  启动浏览器
    const browser = await puppeteer.launch({
            // executablePath: "E:/project/demo/node_modules/puppeteer/.local-chromium/win64-515411/chrome-win32/chrome.exe",   //  项目内下载路径，虚翻墙
            executablePath: "D:/Program Files/chromium/chrome.exe", //  无法翻墙时，需要手动下载并指定chromium的位置
            // headless: false //  是否打开chromium，默认打开
        })
        //  新建选项卡
        , page = await browser.newPage();
    //  跳转地址
    await page.goto(host);
    // 截图
    await page.screenshot({
        path: join(__dirname, "./", webPath.replace(new RegExp("[?/\\:*<>|\"]*", "g"), "") + ".png")
    });
    //  关闭页面或者选项卡
    await browser.close();
}

testMainPage(host)
```

这种方式可以配合Jest或者Mocha+Chai框架进行断言测试：

```typescript
//  ...省略前面代码
test("测试端到端", async function () {
    await testMainPage(host)
    const titleElement = await page.waitForSelector("#title")
    expect(titleElement.getProperty("innerHTML")).toBe("Welcome")
    //  ...省略后面代码
})
```

虽然这种端到端测试同样需要深入业务流程去编写用例，导致每次代码迭代同样必须要更新测试代码，但由于针对的是用户的行为，非常适合用于确认应用或者模块是否符合最初的产品需求和可用性，是否高效等，相比单元测试和集成测试都更适合作为项目交付的保障，若三者选一，端到端测试可能是最好的选择（单元测试是最高性价比的选择）。
不过按照目前的发展，端到端测试可能是交给测试岗位人员进行编写的，而只有单元测试和部分集成测试是交给开发人员编写。

# 方便的库

[http://blog.csdn.net/neal1991/article/details/51249823](验证码识别)
[https://www.cnblogs.com/jianqingwang/p/6978724.html](tesseract-ocr 图像识别)