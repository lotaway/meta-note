// serviceWorker运行环境文件，上下文中无法获取到window、document等对象，只能使用部分内置方法，如fetch、Caches、Request、Response、Url等
(() => {
    const CACHE_NAME = "my-cache" //  缓存库名称
    //  内部封装方法
    const util = {
        //  请求
        fetch(request) {
            // worker里的调用fetch不会被 addEventListener("fetch") 监听事件拦截
            return fetch(request).then(function (response) {
                // 跨域的资源不能缓存（跨域时response.status==0）
                if (!response || response.status !== 200 || response.type !== "basic") {
                    return response
                }
                util.saveCache(request, response.clone())
                return response
            });
        }, //  判断存入缓存，缓存级别 sw > Application Cache manifest > http
        saveCache(request, response) {
            //    后台页面、preview链接不缓存，非GET请求无法缓存（可以手动修改method进行缓存）
            if (request.method === "GET" && request.url.indexOf("/backstage") === -1 && request.url.indexOf("preview_id") === -1) {
                caches.open(CACHE_NAME).then(function (cache) {
                    cache.put(request, response)
                })
            }
        }, //  删除缓存
        deleteCache(request) {
            console.log("删除缓存：" + request)
            caches.open(CACHE_NAME).then(function (cache) {
                return cache.delete(request, {
                    ignoreVary: true
                })
            })
        },
        postMessage(content) {
            clients.matchAll().then(allClients => {
                allClients.forEach(client => client.postMessage(content));
            });
        }
    }

    //  监听sw安装事件
    this.addEventListener("install", function (event) {
        this.skipWaiting() //  跳过等待，立即生效。否则首次安装和更新时预加载后会等待到下次启动时才生效
        console.log("install service worker")
        // 要缓存的地址
        let cacheResources = [/*首页*/"https://somename.com/"]
        event.waitUntil(
            // 创建和打开一个缓存库
            caches.open(CACHE_NAME).then(function (cache) {
                return cache.addAll(cacheResources)
            })
        )
    })

    //  安装完成后会触发激活事件，日常操作都在此事件中进行
    this.addEventListener("active", function (event) {
        console.log("service worker is active");
        //  拦截页面对fetch的调用
        this.addEventListener("fetch", function (event) {
            event.respondWith(
                //  判断是否命中缓存在（url和header都一致才算相同资源，可以设置第二个参数Object {Boolean ignoreVary}忽略header）
                caches.match(event.request)
                    .then(function (response) {
                        //  命中直接返回
                        if (response) {
                            if (response.headers.get("Content-Type").indexOf("text/html") > -1) {
                                //  若是html文件，可以另外做一些处理，例如根据发布的版本文件判断是否有更新
                            }
                            return response
                        }
                        return util.fetch(event.request.clone())
                    }));
        });
        //  接受来自页面的消息
        this.addEventListener("message", function (event) {
            const message = event.data
            console.log("sw收到消息：" + message)
            //  do something
        })
    })
})()