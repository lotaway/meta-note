# 获取内网ip地址

思路即是通过nodejs的os模块读取网络接口，之后从中筛选出本地ip地址即可，代码如下：

```javascript
const os = require('os')

function getLocalIp() {
    const networkInterfaces = os.networkInterfaces()
    for (let dev in networkInterfaces) {
        if (networkInterfaces[dev][1]?.address?.indexOf('192.168') !== -1) {
            return networkInterfaces[dev][1].address
        }
    }
    return null
}

module.exports = getLocalIp
```

调用上述代码获取ip地址：

```javascript
const getLocalIp = require("./getLocalIp")
const localIp = getLocalIp()
console.log(localIp)
//  192.168.44.229
```
