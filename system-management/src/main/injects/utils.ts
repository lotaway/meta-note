export function htmlElementFocus(element: HTMLElement, window: Window) {
    // element.focus()
    const events = ['mousedown', 'mouseup', 'click', 'focus']
    events.forEach(eventType => {
        const event = new MouseEvent(eventType, {
            bubbles: true,
            cancelable: true,
            view: window,
            buttons: 1
        })
        element.dispatchEvent(event)
    })
}