namespace UIButton {
    export enum WebButtonStatus {
        NORMAL,
        ACTIVE,
        DISABLED,
        HOVERED,
    }

    export class Button extends HTMLButtonElement {
        isLoading: boolean
        status: WebButtonStatus

        static get observedAttributes() {
            return ["isLoading", "status"]
        }

        connectedCallback() {
            console.log("connected callback")
        }

        render() {
            console.log("in render")
            this.innerText += "is render"
        }
    }
}

customElements.define("web-button", UIButton.Button, {
    extends: "Button",
})

export default UIButton