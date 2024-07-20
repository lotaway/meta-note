#Requires AutoHotkey v2.0
; 大写锁定键和左Ctrl键交换功能
CapsLock::Ctrl
Ctrl::CapsLock

; 将App Menu键映射为F13
AppsKey::F13

; 定义变量来标记是否按下了Fn键
FnKeyPressed := false

; 当按下Fn键时，改变鼠标左键功能
~F13::{
    FnKeyPressed := true
    return
}

~F13 Up::{
    FnKeyPressed := false
    return
}

; 当Fn键按下时，QWER变成F1~F4的功能
*q::Send % (FnKeyPressed ? "{F1}" : "q") %
*w::Send % (FnKeyPressed ? "{F2}" : "w") %
*e::Send % (FnKeyPressed ? "{F3}" : "e") %
*r::Send % (FnKeyPressed ? "{F4}" : "r") %

; 当Fn键按下时，鼠标左键点击将复制颜色值到剪贴板
;~LButton::{
;    if (FnKeyPressed) {
;        MouseGetPos MouseX, MouseY
;        PixelGetColor color, %MouseX%, %MouseY%, RGB
;        StringRight color, color, 6
;        clipboard := %color%
;    }
;    else {
;        Click
;    }
;    return
;}