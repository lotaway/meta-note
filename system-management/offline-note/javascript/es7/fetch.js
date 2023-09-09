/**
 * fetch() 用于发起获取资源的请求
 * Promise<Response> fetch(input[, init])
 * 成功返回会进入 resolve，HTTP 404不被认为是错误，此时 response.ok 属性不为 true
 * 网络错误等情况会被 reject
 */
const headers = new Headers();

headers.append("Content-Type", "image/jpeg");

fetch("/path/to/request", {
    methods: "GET" //   使用的方法，如 GET、POST
    , headers   //  头信息，形式为 Headers 的对象或包含 ByteString 值的对象字面量。
    , body: ""  //  body 信息：可能是一个Blob、BufferSource、FormData、URLSearchParams 或者 USVString 对象。注意 GET 或 HEAD 方法的请求不能包含 body 信息。
    , mode: "cors" //    模式，如 cors、no-cors 或者 same-origin。
    , credentials: "same-origin"    // 如 omit、same-origin 或者 include。为了在当前域名内自动发送 cookie，必须提供这个选项。
    , cache: "default" //  缓存模式：default、no-store、reload、no-cache、force-cache 或者 only-if-cached。
    , redirect: "manual"  //  可用重定向模式：follow（自动重定向），error（如果产生重定向将自动终止并抛出一个错误），或者 manual（手动处理重定向）。
    , referrer: "client"    //  一个 USVString 可以是 no-referrer、client 或一个 URL。
    , referrerPolicy: ""    //  指定 HTTP 头部 referrer 字段的值。可能为以下值之一：no-referrer、no-referrer-when-downgrade、origin、origin-when-cross-origin、unsafe-url。
    , integrity: "" //  包括请求的 subresource integrity 值
})
    .then(response => {
        // 成功返回
        if (response.ok === true) {
            return response.json();
        }
    })
    .catch(err => {
        // 包含 AbortError、TypeError类型
        console.log(err);
    })
;