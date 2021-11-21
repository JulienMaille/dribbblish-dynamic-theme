export default class Loader {
    /** @type {HTMLDivElement} */
    #container;

    constructor() {
        this.#container = document.createElement("div");
        this.#container.id = "dribbblish-loader";
        this.#container.innerHTML = `
            <svg width="65px" height="65px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
                <circle fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle>
            </svg>
        `;

        document.body.appendChild(this.#container);
    }

    show(text) {
        this.#container.setAttribute("text", text ?? "");
        this.#container.setAttribute("active", "");
    }

    hide() {
        this.#container.removeAttribute("active");
    }
}
