// a valuable, will auto infer the type, like helloWorld: String
var helloWorld = "ss"
print(helloWorld)

//  a constant, can't be edit
let num1 = 1
// num1 = 2
print(num1)

// array
var arr = ["Carl", "Carol", "Crazy"]
print(arr[1])
//  add new item, array will auto increase size
arr.append("Jimmy")

// dictionary
var occupations = ["Carl": "Joker", "Carol": "Captain", "Crazy": "Nurse"]
occupations["Wayne"] = "Batman"

// tuple
var atu = ("Carl", 32, 173, true)

// optional, can be string or nil
var maybeStr: String? = "hello world"
// need force unpacked
var str = maybeStr!
// optional but auto unpacked
var maybeStr2: String! = "hello world"
// will be auto unpacked
var str2 = maybeStr2

//  if-let to judge is not nil then continue
if let name = maybeStr2 {
    print(name)
}

switch str2 {
case "Carl": print("It's Carl!")
case "Carol", "Crazy": print("Hi.")
case let x where x.hasSuffix("world"): print("Oh, it's the \(String(describing: x))")
default: print("...")
}

for val in 1..<4 {
    // [1, 4)
    print(val) // 1, 2, 3
}

for item in arr {
    print(item)
}

var len = 4
while len > 0 {
    print(len -= 1)
}
repeat {
    print(len -= 1)
} while len < 0

func add(a: Int, b: Int) -> Int {
    return a + b
}

func callIt(handler: (Int, Int) -> Int) {
    return handler(2, 4)
}

func canChangeParams(first a : inout Int, second b : inout Int) {
     let temp = a
     a = b
     b = temp
}

func changableParams(numbers: Double...) -> Double {
    var total = 0
    for number in numbers {
        total += number
    }
    return total
}

func main() {
    //  function paramers can use name or not.
    add(a: 2, b: 4)
    //  use function to be the paramer
    callIt(add)

    var x = 10,y = 20 
    canChangeParams(first: &x, second: &y)
    print(x,y)
}

// check the battery and charge status
import UIKit

let device = UIDevice.current
let batteryLevel = device.batteryLevel * 100    //  from 0~1, plus 100 to be 0%~100%
let isCharging = device.batteryState == UIDevice.BatteryState.charging