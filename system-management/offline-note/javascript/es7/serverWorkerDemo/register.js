/*
注册有且只有唯一一个的Service Worker。
注册后会启动后台进程监听同域名的所有页面。
`sw.config.v1.js`是运行环境文件，该文件的路径会决定sw的管理范围，如/page/sw.js只能管理/page路径下的页面和资源，无法处理/api路径下的，因此一般注册到顶级目录。
刷新页面不会导致重新注册，也不会再重新触发install和active事件，更新配置文件会导致重新注册。
重新注册后会先触发install和active并进入waiting状态，等待重启浏览器后才会生效。通过install里调用skipWaiting可以跳过等待。
*/
export function createServiceWorker(options) {
    const workerScriptURL = options?.script ?? "/sw.config.v1.js"
    if (!"serviceWorker" in navigator)
        return console.log("不支持serviceWorker")
    //  注册worker
    navigator.serviceWorker.register(workerScriptURL)
        .then(reg => {
            console.log("注册成功：" + reg)
        })
        .catch(error => {
            console.log("注册失败：" + error)
        })

    //  接受来自worker的消息
    navigator.serviceWorker.addEventListener("message", event => {
        options?.onMessage(event.data, event)
    });

    //  向worker发送消息
    function postMessage(message) {
        navigator.serviceWorker.controller.postMessage(message)
    }

    return {
        postMessage
    }
}