import Overlay from "./Overlay";

export default class Loader {
    /** @type {Overlay} */
    #overlay;

    constructor() {
        this.#overlay = new Overlay();
    }

    show(text) {
        this.#overlay.show({ icon: "loading", text });
    }

    hide() {
        this.#overlay.hide();
    }
}
