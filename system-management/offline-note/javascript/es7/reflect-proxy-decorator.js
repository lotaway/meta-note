//    Reflect提供了若干个能对任意对象进行某种特定的可拦截操作（interceptable operation）的方法。主要用来配合Proxy使用？14 个静态方法，它们的名字刚好和那 14 个代理处理器方法的名字相同，这 14 个方法中有几个刚好在 Object 对象身上也存在同名方法，虽然它们功能类似，但也存在细微差异。

Reflect.apply(target, thisArgument, argumentsList);
//对一个函数进行调用操作，同时可以传入一个数组作为调用参数。和 Function.prototype.apply() 功能类似。

Reflect.construct(target, argumentsList);
//对构造函数进行 new 操作，相当于执行 new target(...args)。

Reflect.defineProperty(target, propertyKey, attributes);
//和 Object.defineProperty() 类似。

Reflect.deleteProperty(target, propertyKey);
//删除对象的某个属性，相当于执行 delete target[name]。

Reflect.enumerate(target);
//该方法会返回一个包含有目标对象身上所有可枚举的自身字符串属性以及继承字符串属性的迭代器，for...in 操作遍历到的正是这些属性。

Reflect.get(target, propertyKey, receiver);
//获取对象身上某个属性的值，类似于 target[name]。

Reflect.getOwnPropertyDescriptor(target, propertyKey);
//类似于 Object.getOwnPropertyDescriptor()。

Reflect.getPrototypeOf(target);
//类似于 Object.getPrototypeOf()。

Reflect.has(target, propertyKey);
//判断一个对象是否存在某个属性，和 in 运算符 的功能完全相同。

Reflect.isExtensible(target);
//类似于 Object.isExtensible().

Reflect.ownKeys(target);
//返回一个包含所有自身属性（不包含继承属性）的数组。

Reflect.preventExtensions(target);
//类似于 Object.preventExtensions()。

Reflect.set(target, propertyKey, value, receiver);
//设置对象身上某个属性的值，类似于 target[name] = val。

Reflect.setPrototypeOf(target, proto);
//类似于 Object.setPrototypeOf()。

/* Proxy(target,handler) 代理其功能非常类似于设计模式中的代理模式，该模式常用于三个方面：
拦截和监视外部对对象的访问
降低函数或类的复杂度
在复杂操作前对操作进行校验或对所需资源进行管理*/
function createValidator(target, validator) {
    //  公用的添加代理验证
    const argTypes = {
        pickyMethodOne: ["object", "string", "number"],
        pickyMethodTwo: ["number", "object"]
    };
    return new Proxy(target, {
        _validator: validator,
        set(target, key, value, proxy) {
            //  设置属性时会被这个set方法拦截
            if (target.hasOwnProperty(key)) {
                let validator = this._validator[key];
                if (!!validator(value)) {
                    //  验证通过时，调用Reflect进行正式的属性设置
                    return Reflect.set(target, key, value, proxy);
                } else {
                    throw Error(`Cannot set ${key} to ${value}. Invalid.`);
                }
            } else {
                throw Error(`${key} is not a valid property`)
            }
        },
        get: function (target, key, proxy) {
            //  获取属性或者调用方法时会被这个方法拦截
            var value = target[key];
            return function (...args) {
                var checkArgs = argChecker(key, args, argTypes[key]);
                return Reflect.apply(value, target, args);
            };
        },
        has: function (target, key) {
            //    当使用例如："key" in proxyObject会调用此方法
        }
        //   @TODO 还有其他方法...
    });
}

function argChecker(name, args, checkers) {
    //  对每个属性进行值和类型检查，在get方法里调用
    for (var idx = 0; idx < args.length; idx++) {
        var arg = args[idx];
        var type = checkers[idx];
        if (!arg || typeof arg !== type) {
            console.warn(`You are incorrectly implementing the signature of ${name}. Check param ${idx + 1}`);
        }
    }
}

const personValidators = {
    //  自定义的验证器
    name(val) {
        //  每个属性名都有对应的验证方法，设置属性值时代理会调用
        return typeof val === 'string';
    },
    age(val) {
        return typeof age === 'number' && age > 18;
    }
};

class Person {
    //  定义一个类，使用代理并传入验证器
    pickyMethodOne(obj, str, num) {
    }

    constructor(validator, name, age) {
        this.name = name;
        this.age = age;
        return createValidator(this, validator);
    }
}

const bill = new Person(personValidators, 'Bill', 25);
//  以下操作都会报错，因为没通过代理验证
bill.name = 0;
bill.age = 'Bill';
bill.age = 15;
bill.pickyMethodOne();  // You are incorrectly implementing the signature of pickyMethodOne. Check param 1  param 2  param 3
bill.pickyMethodOne({}, "a little string", 123);    // No warnings logged

//Proxy.revocable(target, handler)。这个函数一样创建代理，但是创建好的代理后续可被解除。（Proxy.revocable方法返回一个对象，该对象有一个.proxy属性和一个.revoke方法。）一旦代理被解除，它即刻停止运行并抛出所有内部方法。

const {sensitiveData, revokeAccess} = Proxy.revocable({username: 'devbryce'}, handler);
//返回了无名对象，令常量sensitiveData是proxy属性，而revokeAccess是revoke属性
console.log(sensitiveData.username); // logs 'devbryce'
revokeAccess();
console.log(sensitiveData.username); // TypeError: Revoked

/*
Decorator装饰器
相比较而已，Decorator装饰器的固定作用更大，适合通过寄生的关系完成业务本身不关心的代码流程，而Proxy更注重灵活性和前置性，方便完成一些业务判断，例如缓存、日志更适合用装饰器完成，因为比较固定，不会按照业务需要移除/加上；而如果是附加性质的业务功能，例如计算中间管理层和下属员工的奖金，这种可能因为业务上的身份改变或者计算规则朝令夕改的，明天某个部门的员工就改成没有奖金的情况
*/