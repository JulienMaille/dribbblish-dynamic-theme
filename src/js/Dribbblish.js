import ConfigMenu from "./ConfigMenu";
import Info from "./Info";
import Loader from "./Loader";
import Overlay from "./Overlay";
import Icon, { icons } from "./Icons";

export default class Dribbblish {
    /**
     * @typedef {"ready"} Event
     */

    /**
     * @callback listener
     * @param {any} [data]
     * @returns {void}
     */

    /** @type {ConfigMenu} */
    config;

    /** @type {Info} */
    info;

    /** @type {Loader} */
    loader;

    /** @type {Overlay} */
    overlay;

    /** @type {Icon} */
    icons;

    /** @type {Object.<string, listener[]>} */
    #listeners = {};

    /** @type {Boolean} */
    #ready = false;

    constructor() {
        this.config = new ConfigMenu();
        this.info = new Info();
        this.loader = new Loader();
        this.overlay = new Overlay();
        this.icons = icons;

        let tries = 0;
        const interval = setInterval(() => {
            if (++tries > 50) throw new Error("ready timeout");
            if (document.querySelector("#main") == null || Spicetify?.showNotification == undefined || !this.info.isReady()) return;
            this.#ready = true;
            this.emit("ready");
            clearInterval(interval);
        }, 200);
    }

    /**
     * @param {Event} event
     * @param {any} data
     */
    emit(event, data) {
        this.#listeners[event]?.forEach((listener) => listener(data));
    }

    /**
     * @param {Event} event
     * @param {listener} listener
     */
    on(event, listener) {
        this.#listeners[event] = [...(this.#listeners[event] ?? []), listener];
        if (event == "ready" && this.#ready) listener();
    }

    /**
     * @param {Event} event
     * @param {listener} listener
     */
    off(event, listener) {
        this.#listeners = this.#listeners[event].filter((f) => f != listener);
    }
}
