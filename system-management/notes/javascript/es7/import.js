/**

 block scoping － 使用 let 、const 作用域，块辖域
 class、extends - 类、继承
 generators - 生成器
 collections － 集合、映射、弱集合、弱映射
 arrow functions － 箭头函数，简化匿名函数，指定词法作用域
 ...params  - 不定参数，展开参数
 params=value   - 参数默认值
 template strings － 模板字串
 Promise － 用标准化了的方法进行延迟和异步计算
 async/await    - promise对象转同步方法
 symbols － 唯一的、不可修改的数据

 */

// 函数级别严格模式语法
'use strict';

+function ES7() {

    //Map对象是一个简单的键值映射，可以放入字符串/对象/数组等作为键或值，利用set进行键值设置，利用get和键获取值
    let m = new Map([["name1", "mj"], ["name2", "cj"]]);
    m.get("name2"); // cj
    let d = {p: "Hello World"};
    m.set(d, "text content");
    m.get(d);   // "text content"
    console.log(m.size);     //  返回成员数量
    m.delete(d);    //删除键，返回布尔值表示删除是否成功
    m.has(d);    // 确认是否存在该键 返回布尔值
    m.clear();  // 清楚所有成员，无返回值
    //遍历方法
    m.keys();   //  返回键名的遍历器
    for (let key of m.keys()) {
        console.log(key);
    }
    m.values(); //  返回值的遍历器
    m.entries();    //  返回所有成员的的遍历器
    m.forEach((value, key) => func(value, key), m); //  使用回调函数遍历
    // 也可以直接使用语句如：
    // m.forEach((value,key) => console.log(value * 2))

    /**
     *  WeakMap结构与Map结构基本类似，唯一的区别是它只接受对象作为键名（null除外），不接受其他类型的值作为键名，而且键名所指向的对象若在其他地方没有引用时就会自动回收释放资源。
     WeakMap没有size属性，只有四个方法可用：get()、set()、has()、delete()
     */
    var myMap = new WeakMap();
    var keyString = "a string";
    myMap.set(keyString, "和键'a string'关联的值");
    myMap.get(keyString);

    /**数据结构Set。它类似于数组，但是成员的值都是唯一的，没有重复的值。
     向Set加入值的时候，不会发生类型转换，所以5和"5"是两个不同的值。Set内部判断两个值是否不同，使用的算法类似于精确相等运算符（===），这意味着，两个对象总是不相等的。唯一的例外是NaN等于自身（精确相等运算符认为NaN不等于自身）。*/
    let set = new Set();
    [2, 3, 5, 4, 5, 2, 2].map(x => s.add(x));
    for (i of set) {
        console.log(i);  // 2 3 5 4
    }
    set.add("value"); //添加新的值
    if (set.has("value"))  //判断是否存在值
        set.delete("value");  //删除值
    console.log(set.size); //总数量
    set.clear();  //清除所有成员
    //set同样有keys、values、entires、forEach四种遍历方法

    var ws = new WeakSet(); // 类似于WeakMap相对于Map，WeakSet是相对于Set的。


    /**
     * Generator遍历器是一个状态机，封装了多个内部状态。
     * 相对于普通函数,遍历器以function后面的星号为区别,执行此函数会返回一个指针对象，用于遍历状态。
     * 以yield为暂停标记，每次执行指针对象的next()方法，就会从上一次所在位置继续执行到下一个yield或return为止。
     * next()返回一个对象，该对象的value属性就是当前yield语句的值，done属性为false则表示遍历未结束。
     * */
    function* helloWorldGenerator(i) {
        //这个函数有3个状态，2个yield和1个return
        yield 'hello';
        yield i + 1;
        return 'ending';
    }

    var hw = helloWorldGenerator(1); //执行只是返回指向内部状态的指针对象——遍历器对象（Iterator Object）
    hw.next();  //执行两个yield之间的语句，返回的对象value属性为"hello"，done属性为false

    //yield后面可以跟一个遍历器对象，同样加星号区别
    function* secGrator(i) {
        yield* helloWorldGenerator(i);
    }

    var gen = secGrator(2);

    //  语法糖形式：promise，将原本的逐行执行的遍历器变成链式执行
    let promise = new Promise((resolve, reject) => {
        try {
            setTimeout(() => {
                resolve("完成");
            }, 1000);
        } catch (err) {
            reject(err);
        }
    });

    promise.then(function (response) {
        console.log(response);  //  成功
    });

    //  async/await 将promise链式异步形式变成同步
    (async function () {
        let result;

        try {
            result = await new Promise(function (resolve, reject) {
                setTimeout(function () {
                    resolve("成功结果");
                }, 300);
            });
        } catch (err) {
            //  reject in here
        }

        console.log(result);    //  成功结果
    }());

    /**
     * Symbol原始数据类型，表示独一无二的值。它是JavaScript语言的第七种数据类型，
     * 前六种是：Undefined、Null、布尔值（Boolean）、字符串（String）、数值（Number）、对象（Object）。
     * Symbol在创建时接受一个参数作为描述，就算描述相同也是不同的值。
     * */
    var s1 = Symbol("foo");
    var s2 = Symbol("foo");
    console.log(s1 === s2); // false
    // 检查是否存在Symbol值，若不存在则创建一个，之后返回该Symbol
    var s3 = Symbol.for("foo");
    var s4 = Symbol.for("foo");
    console.log(s3 === s4); // true
    //由于每个值都不相等，可以作为属性名，防止改写或覆盖，但不能用“.”方法设置或调用
    var a = {};
    a[s1] = 'Hello!';    // 第一种写法
    var a = {
        [s1]: 'Hello!'     // 第二种写法
    };
    Object.defineProperty(a, s1, {value: 'Hello!'});// 第三种写法
    console.log(a[mySymbol]); // 以上写法都得到同样结果 "Hello!"
    /**
     * Symbol作为属性名，该属性不会出现在for in、for of循环中，也不会被Object.keys()、Object.getOwnPropertyNames()返回。
     * 但是，它也不是私有属性
     */
    //返回一个当前对象的所有用作属性名的Symbol值的成员数组
    Object.getOwnPropertySymbols(a);


    /**
     ``模板字符串，用反括号可以定义多行/跨行字符串，即可以保持换行，更可以加入表达式
     */
    var a = 5;
    var b = 10;
    var str1 = `string text ${a + b}
    mutilate lines
    string text`;

    /**
     模板字符串的一种更高级的形式称为带标签的模板字符串。它允许您通过一个标签函数修改模板字符串的输出。
     标签函数的第一个参数是一个包含了字符串字面值的数组（在本例中分别为“Hello”和“world”）；
     第二个参数，在第一个参数后的每一个参数，都是已经被处理好的替换表达式（在这里分别为“15”和“50”）。最后函数可以返回处理好的字符串。
     标签函数的名称可以为任意的合法标示符。
     */
    function tag(strings) {
        console.log(arguments);    // { '0': [ 'Hello ', ' world ', '' ], '1': 15, '2': 50 }
        console.log(strings[0]);   // "Hello "
        console.log(strings[1]);   // " world "
        console.log(arguments[1]);  // 15
        console.log(arguments[2]);  // 50
        console.log(String.raw(strings));      //输出普通的字符串： "Hello world"
        return "Hubwiz!";
    }

    console.log(tag`Hello ${a + b} world ${a * b}`);  // "Hubwiz!"

    //\uxxxx形式表示一个字符，但只限于\u0000——\uFFFF之间的字符。超出这个范围的字符，必须用两个双字节的形式表达：
    var gu1 = "\uD842\uDFB7";  // "古"
    //新的表示法可以用大括号扩起码点，用单字节形式表达：
    //var gu2 = "\u{D842DFB7}";   // "古"
    //codePointAt可以传入字符位置参数，对字符串返回字符的码点。
    //gu2.codePointAt(0);

    //ES5提供String.fromCharCode方法，用于从码点返回对应字符，但是这个方法不能识别辅助平面的字符（编号大于0xFFFF）。
    String.fromCharCode(0x20BB7);   // "ஷ"
    //上面代码中，String.fromCharCode不能识别大于0xFFFF的码点，所以0x20BB7就发生了溢出，最高位2被舍弃了，最后返回码点U+0BB7对应的字符，而不是码点U+20BB7对应的字符。
    //ES6提供了String.fromCodePoint方法，可以识别0xFFFF的字符，弥补了String.fromCharCode方法的不足。在作用上，正好与codePointAt方法相反。
    String.fromCodePoint(0x20BB7);  // "𠮷"
    //注意，fromCodePoint方法定义在String对象上，而codePointAt方法定义在字符串的实例对象上。


    //除了indexOf方法，可以用来确定一个字符串是否包含在另一个字符串中又提供了三种新方法：
    var s = 'Hello world!';
    s.startsWith('Hello'); // 返回布尔值，表示参数字符串是否在源字符串的头部
    s.endsWith('!'); // 返回布尔值，表示参数字符串是否在源字符串的尾部
    s.includes('o'); // 返回布尔值，表示是否找到了参数字符串
    //这三个方法都支持第二个参数，表示开始搜索的位置。
    s.includes('o', 9);

    const aim = {
        word: "don't move!",
        target: true
    }
    //  定义了常量`obj`，但作为一个对象就算是常量也依旧可以改变属性
    aim.word = "move!"  //  赋值成功
    //  当如果使用`freeze`方法就可以锁定对象不可变
    Object.freeze(aim)
    aim.word = "try move ?" //  错误，无法赋值
    //  使用`create`创建新对象，分离两者
    let looker = Object.create(aim)
    looker.word = "searching"   //  可以修改
    aim.word    //  依旧是"don‘t move"或者第一次赋值的"move!"，而不会是"searching"
}();