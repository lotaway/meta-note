import { useState, useEffect, useRef } from 'react'

interface ScrollInfo {
    top: number
    left: number
}

interface WindowSize {
    width: number
    height: number
}

interface MousePosition {
    x: number
    y: number
}

export function useDebounce(callback: FrameRequestCallback, delay = 0) {
    const timerRef = useRef<NodeJS.Timeout>()
    
    if (timerRef.current) {
        clearTimeout(timerRef.current)
    }
    
    timerRef.current = setTimeout(() => {
        window.requestAnimationFrame(callback)
    }, delay)
    
    return timerRef
}

export function useScroll() {
    const [scrollInfo, setScrollInfo] = useState<ScrollInfo>({
        top: 0,
        left: 0
    })

    useEffect(() => {
        function scrollHandle() {
            setScrollInfo({
                top: document.body.scrollTop,
                left: document.body.scrollLeft
            })
        }

        window.addEventListener("scroll", scrollHandle)
        return () => {
            window.removeEventListener("scroll", scrollHandle)
        }
    }, [])

    return scrollInfo
}

export function useWindowSize() {
    const [windowSize, setWindowSize] = useState<WindowSize>({
        width: window.innerWidth,
        height: window.innerHeight
    })

    useEffect(() => {
        function resizeHandle() {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight
            })
        }

        window.addEventListener("resize", resizeHandle)
        return () => {
            window.removeEventListener("resize", resizeHandle)
        }
    }, [])

    return windowSize
}

export function useMousePosition() {
    const timerRef = useRef<NodeJS.Timeout>()
    const [mousePosition, setMousePosition] = useState<MousePosition>({
        x: 0,
        y: 0
    })

    useEffect(() => {
        function mouseMoveHandle(event: MouseEvent) {
            if (!event) return
            
            if (timerRef.current) {
                clearTimeout(timerRef.current)
            }
            
            timerRef.current = setTimeout(() => {
                window.requestAnimationFrame(() => {
                    setMousePosition({
                        x: event.clientX,
                        y: event.clientY
                    })
                })
            }, 0)
        }

        window.addEventListener("mousemove", mouseMoveHandle)
        return () => {
            window.removeEventListener("mousemove", mouseMoveHandle)
        }
    }, [])

    return mousePosition
}
