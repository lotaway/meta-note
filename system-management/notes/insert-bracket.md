# 题目：根据输入的整数Int n(1<n<8)作为括号总数量，并输出所有括号可能性组合的数组string[]。

## 例子1

输入：`n=1`
输出：`["()"]`

## 例子2

输入：`n=3`
输出：`["((()))", "(()())", "(())()", "()(())", "()()()"]`

```javascript
function handler(n) {
    let res;
    //	code here...

    return res;
}
```

之所以说这道题奇怪是因为，我之前看到的编程算法题也有关于括号排序的，但那道题是提供了含有多个括号的字符串，如"(()()))))()"
，要求你算出需要补充多少个半边括号才能让所有括号都能成为正确的一对左右括号。
这种括号排序是存在的，主要是用于像html编辑器里自动补足左右标签的。但是上边写出来的这种题，我一时之间想不出有什么用途，难道是用于拖拽区块时预先计算可能的排序？
而且这题我花了半小时只想到对字符串插入值，但还没想清楚用什么规则插入，而测试时是一小时完成两道算法题，所以当时我是超时自动提交了无法回答了。
下面是我又再花了一日一夜完成的解法（语法：javascript）：

```javascript
/*
第一种思路是打散字符串插值
将字符串A插入到长度为L的字符串B中所有字符的前后间隙位置中得到Array(L+1)个可能性结果，之后再将结果去重得到本次真正的结果。
之后根据输入值循环n次，得到最终结果。
其中字符串A="()"，字符串B就是上一次得到的n-1结果数组[字符串B1,字符串B2]，进行迭代得到的。
 */
function handler(n) {
    //  code here...
    let res = [""];
    //  获取所有插值可能性
    const single = (str = "", ins = "()") => {
        const strArr = [...str.split(""), ""];  //  数组最后一位添加任意项，确保前后空隙都会插入值
        return Array.from(new Set(strArr.map((noMatter, index) => {
            let _arr = Array.from(strArr);
            _arr.splice(index, 0, ins);
            return _arr.join("");
        })));
    };
    //  根据输入值执行n次插入
    while (n > 0) {
        res = res.reduce((prev, item) => Array.from(new Set([...prev, ...single(item)])), []);
        n--;
    }
    return res;
}

/*
第二种思路是先转换为数值单位进行叠加
是先将字符值"()"视为一个数值单位1，之后每次进行是间隙和自身都叠加值，第一次是[1]，第二次是[[1,1],[2]]，第三次是[[1,1,1],[2,1],[1,2],[3]]，最后才根据单位数量叠加数量重新替换为字符值，例如2="(())"，3="((()))"。
本质上这种方法没有脱离第一种思路，只是少了迭代过程中数组和字符串之间频繁来回转换的行为，只需要在首尾各进行一次转换即可，所以不再放具体代码，感兴趣的可以自行实现。
 */
```

# 完整示例代码

将下列代码复制保存为本地文件`filename.js`，然后在命令行里输入`node filename.js`运行就可以进行输入和输出测试了：

```js
//	@@filename.js
const readline = require("readline");
const insReadline = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function showQuestion(question = "Please input the number of brackets you want, 0<number<8 \n", _handler = handler) {
    insReadline.question(question, input => {
        try {
            if (input >= 8 || input < 1) {
                throw new Error("input should be in [1,8].");
            }
            console.log("result:" + JSON.stringify(_handler(input)));
        } catch (err) {
            console.log(err);
        }
        console.log("End...");
        showQuestion();
    });
}

// 使用第一种思路：打散字符串插值
function handler(n) {
    //  code here...
    let res = [""];
    //  获取所有插值可能性
    const single = (str = "", ins = "()") => {
        const strArr = [...str.split(""), ""];  //  数组最后一位添加任意项，确保前后空隙都会插入值
        return Array.from(new Set(strArr.map((noMatter, index) => {
            let _arr = Array.from(strArr);
            _arr.splice(index, 0, ins);
            return _arr.join("");
        })));
    };
    //  根据输入值执行n次插入
    while (n > 0) {
        res = res.reduce((prev, item) => Array.from(new Set([...prev, ...single(item)])), []);
        n--;
    }
    return res;
}

//  don't touch
showQuestion();
```

以上就是该编程算法题的问题、解题思路和代码实现啦，欢迎有更好解法在下方评论~~