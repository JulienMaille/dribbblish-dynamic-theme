import $ from "jquery";
import MarkdownIt from "markdown-it";
import MarkdownItAttrs from "markdown-it-attrs";

import { waitForElement } from "./Util";

export default class Info {
    /**
     * @typedef {Object} DribbblishInfo
     * @property {String} [text]
     * @property {String} [tooltip]
     * @property {String} [icon]
     * @property {onClick} [onClick]
     */

    /**
     * @callback onClick
     * @returns {void}
     */

    /** @type {HTMLDivElement} */
    #container;

    constructor() {
        this.md = MarkdownIt({
            html: true,
            breaks: true,
            linkify: true,
            typographer: true
        });
        this.md.use(MarkdownItAttrs);

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
        elem.innerHTML = `${this.md.render(info.text ?? "")}${info.icon ?? ""}`;

        this.#container.appendChild(elem);
    }

    remove(key) {
        $(this.#container).find(`[key="${key}"]`).remove();
    }
}
