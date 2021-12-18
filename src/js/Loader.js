import { icons } from "./Icons";

export default class Loader {
    /** @type {HTMLDivElement} */
    #container;

    constructor() {
        this.#container = document.createElement("div");
        this.#container.id = "dribbblish-loader";
        this.#container.innerHTML = /* html */ `
            <div>
                ${icons.get("loading", { size: 64 })}
                <span></span>
            </div>
        `;

        document.body.appendChild(this.#container);
    }

    show(text) {
        this.#container.querySelector("span").innerText = text ?? "Loading...";
        this.#container.setAttribute("active", "");
    }

    hide() {
        this.#container.removeAttribute("active");
    }
}
