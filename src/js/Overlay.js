import { defaults } from "./Util";
import { icons } from "./Icons";

export default class Overlay {
    /**
     * @typedef {Object} DribbblishOverlayOptions
     * @property {String} icon
     * @property {String} text
     * @property {DribbblishOverlayColor} color
     */

    /**
     * @typedef {Object} DribbblishOverlayColor
     * @property {String} [icon]
     * @property {String} [text]
     */

    /** @type {HTMLDivElement} */
    #container;

    /** @type {HTMLElement} */
    #iconElem;

    /** @type {HTMLSpanElement} */
    #textElem;

    constructor() {
        this.#container = document.createElement("div");
        this.#container.id = "dribbblish-overlay";
        this.#container.innerHTML = /* html */ `
            <div>
                <i></i>
                <span>Loading...</span>
            </div>
        `;

        this.#iconElem = this.#container.querySelector("i");
        this.#textElem = this.#container.querySelector("span");

        document.body.appendChild(this.#container);
    }

    /**
     *
     * @param {DribbblishOverlayOptions} options
     */
    show(options) {
        const defaultOptions = {
            icon: "",
            text: "",
            color: {
                icon: "var(--spice-text)",
                text: "var(--spice-subtext)"
            }
        };
        options = defaults(options, defaultOptions);
        if (options.icon != "" && !options.icon.startsWith("<svg")) options.icon = icons.get(options.icon, { size: 64 });
        this.#iconElem.innerHTML = options.icon;
        this.#iconElem.style.setProperty("--color", options.color.icon);
        this.#textElem.innerHTML = options.text;
        this.#textElem.style.setProperty("--color", options.color.text);
        this.#container.setAttribute("active", "");
    }

    hide() {
        this.#container.removeAttribute("active");
    }
}
