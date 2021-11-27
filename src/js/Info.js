import $ from "jquery";
import { icons } from "./Icons";

import { waitForElement } from "./Util";

export default class Info {
    /**
     * @typedef {Object} DribbblishInfo
     * @property {String} [text]
     * @property {String} [tooltip]
     * @property {String} [icon] svg string or icon name
     * @property {DribbblishInfoColor} [color]
     * @property {Number} [order=0] order < 0 = More to the Left | order > 0 = More to the Right
     * @property {onClick} [onClick]
     */

    /**
     * @typedef {Object} DribbblishInfoColor
     * @property {String} [fg]
     * @property {String} [bg]
     */

    /**
     * @callback onClick
     * @returns {void}
     */

    /** @type {HTMLDivElement} */
    #container;

    /** @type {MarkdownIt} */
    #md;

    /** @type {Boolean} */
    #ready = false;

    constructor() {
        waitForElement([".main-topBar-container", ".main-userWidget-box"], ([topBarContainer, userWidget]) => {
            this.#container = document.createElement("div");
            this.#container.id = "dribbblish-info-container";
            topBarContainer.insertBefore(this.#container, userWidget);

            this.#ready = true;
        });
    }

    isReady() {
        return this.#ready;
    }

    /**
     * @param {String} key
     * @param {DribbblishInfo} info
     */
    set(key, info) {
        if (!this.#ready) {
            setTimeout(() => this.set(key, info), 200);
            return;
        }

        this.remove(key);
        if (info == null) return;
        if (info.text == null && info.icon == null) throw new Error("invalid info");

        const elem = document.createElement("div");
        elem.classList.add("dribbblish-info-item");
        elem.addEventListener("click", info.onClick);
        elem.setAttribute("key", key);
        if (info.text == null) elem.setAttribute("icon-only", "");
        if (info.tooltip != null) elem.setAttribute("title", info.tooltip);
        if (info.onClick != null) elem.setAttribute("clickable", "");
        if (info.color != null) {
            const { fg, bg } = info.color;
            if (fg != null) elem.style.color = fg;
            if (bg != null) elem.style.backgroundColor = bg;
        }
        if (info.order != 0) elem.style.order = info.order;
        if (!info.icon.startsWith("<svg")) info.icon = icons.get(info.icon, { size: 18 });
        elem.innerHTML = `${info.text ?? ""}${info.icon ?? ""}`;

        this.#container.appendChild(elem);
    }

    /**
     * @param {String} key
     */
    remove(key) {
        $(this.#container).find(`.dribbblish-info-item[key="${key}"]`).remove();
    }
}
