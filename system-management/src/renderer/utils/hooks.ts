import {ref, reactive, onMounted, onUnmounted} from "vue"

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

interface SequenceItem {
    id: number
    type: string
    handle: FrameRequestCallback
}

export function useDebounce(callback: FrameRequestCallback, delay = 0) {
    const refTimer = ref()
    if (refTimer.value)
        clearTimeout(refTimer.value)
    refTimer.value = setTimeout(() => {
        window.requestAnimationFrame(callback)
    }, delay)
    return refTimer
}

export function useScroll() {
    const scrollInfo = reactive<ScrollInfo>({
        top: 0,
        left: 0
    })

    function scrollHandle(event: Event) {
        scrollInfo.top = document.body.scrollTop
        scrollInfo.left = document.body.scrollLeft
    }

    onMounted(() => {
        window?.addEventListener("scroll", scrollHandle)
    })
    onUnmounted(() => {
        window?.removeEventListener("scroll", scrollHandle)
    })
    return scrollInfo
}

export function useWindowSize() {
    const windowSize = reactive<WindowSize>({
        width: 0,
        height: 0
    })

    function resizeHandle() {
        windowSize.width = window.innerWidth
        windowSize.height = window.innerHeight
    }

    onMounted(() => {
        window?.addEventListener("resize", resizeHandle)
    })
    onUnmounted(() => {
        window?.removeEventListener("resize", resizeHandle)
    })

    return windowSize
}

export function useMousePosition() {
    const refTimer = ref()
    // const refTimer = useDebounce(sequenceHandle)
    const mousePosition = reactive<MousePosition>({
        x: 0,
        y: 0
    })
    /*const sequence = reactive<SequenceItem[]>([])

    function sequenceHandle(time: DOMHighResTimeStamp) {
        if (sequence.length === 0)
            return false
        //  or do something...
        const {id, handle} = sequence.shift() as SequenceItem
        handle(time)
    }*/

    function mouseMoveHandle(event: MouseEvent) {
        if (!event)
            return false
        if (refTimer.value)
            clearTimeout(refTimer.value)
        refTimer.value = setTimeout(() => {
            window.requestAnimationFrame(() => {
                mousePosition.x = event.clientX
                mousePosition.y = event.clientY
            })
        }, 0)
        /*if (sequence.length > 0)
            return false
        sequence.push({
            id: Math.random(),
            type: "updateMouseMove",
            handle() {
                mousePosition.x = event.clientX
                mousePosition.y = event.clientY
            }
        })*/
    }

    onMounted(() => {
        window?.addEventListener("mousemove", mouseMoveHandle)
    })
    onUnmounted(() => {
        window?.removeEventListener("mousemove", mouseMoveHandle)
    })

    return mousePosition
}
