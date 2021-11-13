import $ from "jquery";

import { waitForElement } from "./Util";

export default class Info {
    /**
     * @typedef {Object} DribbblishInfo
     * @property {String} [text]
     * @property {String} [tooltip]
     * @property {String} [icon]
     * @property {{fg: String, bg: String}} [color] defaults to {fg: "sidebar-text", bg: "button"}
     * @property {Number} [order=0] order < 0 = More to the Left | order > 0 = More to the Right
     * @property {onClick} [onClick]
     */

    /**
     * @callback onClick
     * @returns {void}
     */

    /** @type {HTMLDivElement} */
    #container;

    /** @type {MarkdownIt} */
    #md;

    constructor() {
        waitForElement([".main-topBar-container", ".main-userWidget-box"], ([topBarContainer, userWidget]) => {
            this.#container = document.createElement("div");
            this.#container.id = "dribbblish-info-container";
            topBarContainer.insertBefore(this.#container, userWidget);
        });
    }

    /**
     * @param {String} key
     * @param {DribbblishInfo} info
     */
    set(key, info) {
        this.remove(key);
        if (info.text == null && info.icon == null) throw new Error("invalid info");

        const elem = document.createElement("div");
        elem.classList.add("dribbblish-info-item");
        elem.addEventListener("click", info.onClick);
        elem.setAttribute("key", key);
        if (info.text == null) elem.setAttribute("icon-only", "");
        if (info.tooltip != null) elem.setAttribute("title", info.tooltip);
        if (info.onClick != null) elem.setAttribute("clickable", "");
        if (info.color != null) {
            const { bg, fg } = info.color;
            if (bg != null) elem.style.backgroundColor = bg;
            if (fg != null) elem.style.color = fg;
        }
        if (info.order != 0) elem.style.order = info.order;
        elem.innerHTML = `${info.text ?? ""}${info.icon ?? ""}`;

        this.#container.appendChild(elem);
    }

    remove(key) {
        $(this.#container).find(`.dribbblish-info-item[key="${key}"]`).remove();
    }
}
