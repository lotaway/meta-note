;Notes: #==win !==Alt ^==Ctrl  +==shift
;https://wyagd001.github.io/zh-cn/docs/misc/Clipboard.htm

#+f::
	Run https://www.teambition.com/project
return
#t::
	MouseGetPos, MouseX, MouseY
	; 获得鼠标所在坐标，把鼠标的 X 坐标赋值给变量 mouseX ，同理 mouseY
	PixelGetColor, color, %MouseX%, %MouseY%, RGB
	; 调用 PixelGetColor 函数，获得鼠标所在坐标的 RGB 值，并赋值给 color
	StringRight color,color,6
	; 截取 color（第二个 color）右边的6个字符，因为获得的值是这样的：#RRGGBB，一般我们只需要 RRGGBB 部分。把截取到的值再赋给 color（第一个 color）。
	clipboard = %color%
	; 把 color 的值发送到剪贴板
return

RShift & ScrollLock::suspend

;multimedia and Internet buttons
;Browser_Back
;Browser_Forward
;Browser_Refresh
;Browser_Stop
RShift & AppsKey::Browser_Search
;Browser_Favorites
;Browser_Home
RShift & PrintScreen::Volume_Mute
RShift & Pause::NumLock
RShift & Insert::Media_Play_Pause
;RShift & Delete::Media_Stop
RShift & Home::Media_Prev
RShift & End::Media_Next
RShift & PgUp::Volume_Up
RShift & PgDn::Volume_Down

;CapsLock & \::Backspace
;CapsLock::ScrollLock
;ScrollLock::CapsLock
;LCtrl::ScrollLock
RWin::AppsKey

;Screen Bright

SetWorkingDir %A_ScriptDir%
;AppsKey & Up::
;	MoveBRightness(1)
;return
 
;AppsKey & Down::
;	MoveBRightness(-1)
;return
 
MoveBrightness(IndexMove)
{
 
	VarSetCapacity(SupportedBRightness, 256, 0)
	VarSetCapacity(SupportedBRightnessSize, 4, 0)
	VarSetCapacity(BRightnessSize, 4, 0)
	VarSetCapacity(BRightness, 3, 0)
 
	hLCD := DllCall("CreateFile"
		, Str, "\\.\LCD"
		, UInt, 0x80000000 | 0x40000000 ;Read | Write
		, UInt, 0x1 | 0x2  ; File Read | File Write
		, UInt, 0
		, UInt, 0x3        ; open any existing file
		, UInt, 0
		, UInt, 0)
 
	if hLCD != -1
	{
		DevVideo := 0x00000023, BuffMethod := 0, Fileacces := 0
		NumPut(0x03, BRightness, 0, "UChar")      ; 0x01 = Set AC, 0x02 = Set DC, 0x03 = Set both
		NumPut(0x00, BRightness, 1, "UChar")      ; The AC bRightness level
		NumPut(0x00, BRightness, 2, "UChar")      ; The DC bRightness level
		DllCall("DeviceIoControl"
			, UInt, hLCD
			, UInt, (DevVideo<<16 | 0x126<<2 | BuffMethod<<14 | Fileacces) ; IOCTL_VIDEO_QUERY_DISPLAY_BRIGHTNESS
			, UInt, 0
			, UInt, 0
			, UInt, &Brightness
			, UInt, 3
			, UInt, &BrightnessSize
			, UInt, 0)
 
		DllCall("DeviceIoControl"
			, UInt, hLCD
			, UInt, (DevVideo<<16 | 0x125<<2 | BuffMethod<<14 | Fileacces) ; IOCTL_VIDEO_QUERY_SUPPORTED_BRIGHTNESS
			, UInt, 0
			, UInt, 0
			, UInt, &SupportedBrightness
			, UInt, 256
			, UInt, &SupportedBrightnessSize
			, UInt, 0)
 
		ACBRightness := NumGet(BRightness, 1, "UChar")
		ACIndex := 0
		DCBRightness := NumGet(BRightness, 2, "UChar")
		DCIndex := 0
		BufferSize := NumGet(SupportedBRightnessSize, 0, "UInt")
		MaxIndex := BufferSize-1
 
		loop, %BufferSize%
		{
			ThisIndex := A_Index-1
			ThisBRightness := NumGet(SupportedBRightness, ThisIndex, "UChar")
			if ACBRightness = %ThisBRightness%
				ACIndex := ThisIndex
			if DCBRightness = %ThisBRightness%
				DCIndex := ThisIndex
		}
 
		if DCIndex >= %ACIndex%
			BRightnessIndex := DCIndex
		else
			BRightnessIndex := ACIndex
 
		BRightnessIndex += IndexMove
 
		if BRightnessIndex > %MaxIndex%
			BRightnessIndex := MaxIndex
 
		if BRightnessIndex < 0
			BRightnessIndex := 0
 
		NewBRightness := NumGet(SupportedBRightness, BRightnessIndex, "UChar")
 
		NumPut(0x03, BRightness, 0, "UChar")               ; 0x01 = Set AC, 0x02 = Set DC, 0x03 = Set both
		NumPut(NewBRightness, BRightness, 1, "UChar")      ; The AC bRightness level
		NumPut(NewBRightness, BRightness, 2, "UChar")      ; The DC bRightness level
 
		DllCall("DeviceIoControl"
			, UInt, hLCD
			, UInt, (DevVideo<<16 | 0x127<<2 | BuffMethod<<14 | Fileacces) ; IOCTL_VIDEO_SET_DISPLAY_BRIGHTNESS
			, UInt, &Brightness
			, UInt, 3
			, UInt, 0
			, UInt, 0
			, UInt, 0
			, Uint, 0)
 
		DllCall("CloseHandle", UInt, hLCD)
 
	}
 
}

;XButton1::F24

u::
	if(getKeyState("ScrollLock", "T"))
		Send 4
	else 
		Send u
	return

i::
	if(getKeyState("ScrollLock", "T"))
		Send 5
	else 
		Send i
	return

o::
	if(getKeyState("ScrollLock", "T"))
		Send 6
	else 
		Send o
	return

j::
	if(getKeyState("ScrollLock", "T"))
		Send 1
	else 
		Send j
	return

k::
	if(getKeyState("ScrollLock", "T"))
		Send 2
	else 
		Send k
	return

l::
	if(getKeyState("ScrollLock", "T"))
		Send 3
	else 
		Send l
	return

m::
	if(getKeyState("ScrollLock", "T"))
		Send 0
	else 
		Send m
	return

sc033::
	if(getKeyState("ScrollLock", "T"))
		Send 00
	else
		SendInput {,}
	return

sc01A::
	if(getKeyState("ScrollLock", "T"))
		Send {Enter}
	else
		Send [
	return

sc027::
	if(getKeyState("ScrollLock", "T"))
		Send {+}
	else
		Send {;}
	return

sc028::
	if(getKeyState("ScrollLock", "T"))
		Send *
	else
		Send '
	return

;#^j::
;	Run D:\Program Files\Notepad++\notepad++.exe
;	WinActivate Notepad,1
;	WinWaitActive new,1
;	Send 7 lines{!}{Enter}
;	SendInput inside the ctrl{+}j hotkey
;return

#y::
	Run https://www.baidu.com/s?wd=%Clipboard%
return

;!e::
;    Send {#}
;return

;SpaceFn

#inputlevel,2

$RCtrl::

	SetMouseDelay -1

	Send {Blind}{F24 DownR}

	KeyWait, RAlt

	Send {Blind}{F24 up}

	if(A_ThisHotkey="$RAlt" and A_TimeSinceThisHotkey<300)

		Send {Blind}{RAlt DownR}
		Send {Blind}{Ralt up}
	return



#inputlevel,1

F24 & q::F1

F24 & w::F2

F24 & e::F3

F24 & r::F4

F24 & a::F5

F24 & s::F6

F24 & d::F7

F24 & f::F8

F24 & z::F9

F24 & x::F10

F24 & c::F11

F24 & v::F12

F24 & u::Ins

F24 & i::Home

F24 & j::End

F24 & p::End

F24 & m::left

F24 & o::up

F24 & k::left

F24 & l::down

F24 & sc027::right

F24 & sc028::Del

F24 & \::Backspace

F24 & Shift::
	Send {shift Down}
	Sleep 16
	Send {shift Up}