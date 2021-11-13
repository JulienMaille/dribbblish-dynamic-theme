import $ from "jquery";
import MarkdownIt from "markdown-it";
import MarkdownItAttrs from "markdown-it-attrs";

import svgUndo from "svg/undo";

export default class ConfigMenu {
    /**
     * @typedef {Object} DribbblishConfigItem
     * @property {"checkbox" | "select" | "button" | "slider" | "number" | "text" | "textarea" | "time" | "color"} type
     * @property {String|DribbblishConfigArea} [area={name: "Main Settings", order: 0}]
     * @property {any} [data={}]
     * @property {Number} [order=0] order < 0 = Higher up | order > 0 = Lower Down
     * @property {String} [key] defaults to `${area}_${name]`. e.g: About_Info
     * @property {String} name
     * @property {String} [description=""]
     * @property {any} [defaultValue]
     * @property {Boolean} [hidden=false]
     * @property {Boolean} [resetButton=true]
     * @property {Boolean} [insertOnTop=false]
     * @property {Boolean} [fireInitialChange=true]
     * @property {Boolean} [save=true]
     * @property {showChildren} [showChildren]
     * @property {onAppended} [onAppended]
     * @property {onChange} [onChange]
     * @property {DribbblishConfigItem[]} [children=[]]
     * @property {String} [childOf=null] key of parent (set automatically)
     */

    /**
     * @typedef DribbblishConfigArea
     * @property {String} name
     * @property {Number} [order=0] order < 0 = Higher up | order > 0 = Lower Down
     * @property {Boolean} [toggleable=true]
     */

    /**
     * @callback showChildren
     * @this {DribbblishConfigItem}
     * @param {any} value
     * @returns {Boolean | String[]}
     */

    /**
     * @callback onAppended
     * @this {DribbblishConfigItem}
     * @returns {void}
     */

    /**
     * @callback onChange
     * @this {DribbblishConfigItem}
     * @param {any} value
     * @returns {void}
     */

    /** @type {Object.<string, DribbblishConfigItem>} */
    #config;

    /** @type {MarkdownIt} */
    #md;

    constructor() {
        this.#config = {};
        this.configButton = new Spicetify.Menu.Item("Dribbblish Settings", false, () => this.open());
        this.configButton.register();
        this.#md = MarkdownIt({
            html: true,
            breaks: true,
            linkify: true,
            typographer: true
        });
        this.#md.use(MarkdownItAttrs);

        const container = document.createElement("div");
        container.id = "dribbblish-config";
        container.innerHTML = /* html */ `
            <div class="dribbblish-config-container">
                <button aria-label="Close" class="dribbblish-config-close main-trackCreditsModal-closeBtn">
                    <svg width="18" height="18" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M31.098 29.794L16.955 15.65 31.097 1.51 29.683.093 15.54 14.237 1.4.094-.016 1.508 14.126 15.65-.016 29.795l1.414 1.414L15.54 17.065l14.144 14.143" fill="currentColor" fill-rule="evenodd"></path></svg>
                </button>
                <h1>Dribbblish Settings</h1>
                <div class="dribbblish-config-areas"></div>
            </div>
            <div class="dribbblish-config-backdrop"></div>
        `;

        document.body.appendChild(container);
        $(".dribbblish-config-close").on("click", () => this.close());
        $(".dribbblish-config-backdrop").on("click", () => this.close());
    }

    open() {
        $("#dribbblish-config").attr("active", true);
    }

    close() {
        $("#dribbblish-config").removeAttr("active");
    }

    /**
     * @private
     * @param {DribbblishConfigItem} options
     */
    addInputHTML(options) {
        this.registerArea(options.area);
        const parent = document.querySelector(`.dribbblish-config-area[name="${options.area.name}"] .dribbblish-config-area-items`);

        const elem = document.createElement("div");
        if (options.order != 0) elem.style.order = options.order;
        elem.classList.add("dribbblish-config-item");
        elem.setAttribute("key", options.key);
        elem.setAttribute("type", options.type);
        if (options.hidden) elem.setAttribute("hidden", true);
        if (options.childOf) elem.setAttribute("parent", options.childOf);
        elem.innerHTML = /* html */ `
            ${
                options.name != null && options.description != null
                    ? /* html */ `
                        <div class="dribbblish-config-item-header">
                            <h2 class="x-settings-title main-type-cello" as="h2" empty="${options.name == null}">
                                ${options.name}
                                ${options.resetButton ? /* html */ `<button aria-label="Reset" class="dribbblish-config-item-reset main-trackCreditsModal-closeBtn">${svgUndo}</button>` : ""}
                            </h2>
                            <label class="main-type-mesto" empty="${options.description == null}" markdown>${this.#md.render(options.description)}</label>
                        </div>
                    `
                    : ""
            }
            <div class="dribbblish-config-item-input">
                <label class="x-toggle-wrapper x-settings-secondColumn">
                    ${options.input}
                </label>
            </div>
        `;

        if (options.insertOnTop && parent.children.length > 0) {
            parent.insertBefore(elem, parent.children[0]);
        } else {
            parent.appendChild(elem);
        }

        const $inputElem = $(elem).find("input, textarea, select");
        const $resetButton = $(elem).find(".dribbblish-config-item-reset");

        if ($resetButton.length > 0) {
            $resetButton.on("click", () => {
                this.reset(options.key);
                const defaultVal = this.get(options.key);
                if (options.type == "checkbox") {
                    $inputElem.prop("checked", defaultVal);
                } else {
                    $inputElem.prop("value", defaultVal);
                }
                options.onChange(defaultVal);
            });
        }
    }

    /**
     * @param {DribbblishConfigItem} options
     */
    register(options) {
        /** @type {DribbblishConfigItem} */
        const defaultOptions = {
            hidden: false,
            area: "Main Settings",
            order: 0,
            data: {},
            name: "",
            description: "",
            hidden: false,
            resetButton: true,
            insertOnTop: false,
            fireInitialChange: true,
            save: true,
            showChildren: () => true,
            onAppended: () => {},
            onChange: () => {},
            children: [],
            childOf: null
        };
        // Set Defaults
        options = { ...defaultOptions, ...options };
        if (typeof options.area == "string") options.area = { name: options.area, order: 0 };
        if (options.key == null) options.key = `${options.area.name}_${options.name}`.split(" ").join("_");
        options.description = options.description
            .split("\n")
            .filter((line) => line.trim() != "")
            .map((line) => line.trim())
            .join("\n");
        options._onChange = options.onChange;
        options.onChange = (val) => {
            $(`.dribbblish-config-item[key="${options.key}"]`).attr("changed", options.save && val != options.defaultValue ? "" : null);
            options._onChange.call(options, val);
            const show = options.showChildren.call(options, val);
            options.children.forEach((child) => this.setHidden(child.key, Array.isArray(show) ? !show.includes(child.key) : !show));
        };
        options.children = options.children.map((child) => {
            return { ...child, area: options.area, childOf: options.key };
        });

        this.#config[options.key] = options;

        if (options.type == "checkbox") {
            const input = /* html */ `
                <input id="dribbblish-config-input-${options.key}" class="x-toggle-input" type="checkbox"${this.get(options.key) ? " checked" : ""}>
                <span class="x-toggle-indicatorWrapper">
                    <span class="x-toggle-indicator"></span>
                </span>
            `;
            this.addInputHTML({ ...options, input });

            $(`#dribbblish-config-input-${options.key}`).on("change", (e) => {
                this.set(options.key, e.target.checked, options.save);
                options.onChange(this.get(options.key));
            });
        } else if (options.type == "select") {
            // Validate
            const val = this.get(options.key);
            if (!Object.keys(options.data).includes(val)) this.reset(options.key);

            const input = /* html */ `
                <select class="main-dropDown-dropDown" id="dribbblish-config-input-${options.key}">
                    ${Object.entries(options.data)
                        .map(([key, name]) => `<option value="${key}"${this.get(options.key) == key ? " selected" : ""}>${name}</option>`)
                        .join("")}
                </select>
            `;
            this.addInputHTML({ ...options, input });

            $(`#dribbblish-config-input-${options.key}`).on("change", (e) => {
                this.set(options.key, e.target.value, options.save);
                options.onChange(this.get(options.key));
            });
        } else if (options.type == "button") {
            if (typeof options.data != "string") options.data = options.name;
            options.fireInitialChange = false;
            options.resetButton = false;
            options.save = false;

            const input = /* html */ `
                <button class="main-buttons-button main-button-primary" type="button" id="dribbblish-config-input-${options.key}">
                    <div class="x-settings-buttonContainer">
                        <span>${options.data}</span>
                    </div>
                </button>
            `;
            this.addInputHTML({ ...options, input });

            $(`#dribbblish-config-input-${options.key}`).on("click", (e) => {
                options.onChange(true);
            });
        } else if (options.type == "number") {
            // Validate
            if (options.defaultValue == null) options.defaultValue = 0;
            const val = this.get(options.key);
            if (options.data.min != null && val < options.data.min) this.set(options.key, options.data.min, options.save);
            if (options.data.max != null && val > options.data.max) this.set(options.key, options.data.max, options.save);

            const input = /* html */ `
                <input
                    type="number"
                    id="dribbblish-config-input-${options.key}"
                    ${options.data.min != null ? `min="${options.data.min}"` : ""}
                    ${options.data.max != null ? `max="${options.data.max}"` : ""}
                    step="${options.data.step ?? 1}"
                    value="${this.get(options.key)}"
                >
            `;
            this.addInputHTML({ ...options, input });

            // Prevent inputting +, - and e. Why is it even possible in the first place?
            $(`#dribbblish-config-input-${options.key}`).on("keypress", (e) => {
                if (["+", "-", "e"].includes(e.key)) e.preventDefault();
            });

            $(`#dribbblish-config-input-${options.key}`).on("input", (e) => {
                if (options.data.min != null && e.target.value < options.data.min) e.target.value = options.data.min;
                if (options.data.max != null && e.target.value > options.data.max) e.target.value = options.data.max;

                this.set(options.key, Number(e.target.value), options.save);
                options.onChange(this.get(options.key));
            });
        } else if (options.type == "text") {
            if (options.defaultValue == null) options.defaultValue = "";

            const input = /* html */ `
                <input type="text" id="dribbblish-config-input-${options.key}" value="${this.get(options.key)}">
            `;
            this.addInputHTML({ ...options, input });

            $(`#dribbblish-config-input-${options.key}`).on("input", (e) => {
                // TODO: maybe add an validation function via `data.validate`
                this.set(options.key, e.target.value, options.save);
                options.onChange(this.get(options.key));
            });
        } else if (options.type == "textarea") {
            if (options.defaultValue == null) options.defaultValue = "";

            const input = /* html */ `
                <textarea id="dribbblish-config-input-${options.key}">${this.get(options.key)}</textarea>
            `;
            this.addInputHTML({ ...options, input });

            $(`#dribbblish-config-input-${options.key}`).on("input", (e) => {
                // TODO: maybe add an validation function via `data.validate`
                this.set(options.key, e.target.value, options.save);
                options.onChange(this.get(options.key));
            });
        } else if (options.type == "slider") {
            // Validate
            if (options.defaultValue == null) options.defaultValue = 0;
            const val = this.get(options.key);
            if (options.data.min != null && val < options.data.min) this.set(options.key, options.data.min, options.save);
            if (options.data.max != null && val > options.data.max) this.set(options.key, options.data.max, options.save);

            const input = /* html */ `
                <input
                    type="range"
                    id="dribbblish-config-input-${options.key}"
                    name="${options.name}"
                    min="${options.data?.min ?? "0"}"
                    max="${options.data?.max ?? "100"}"
                    step="${options.data?.step ?? "1"}"
                    value="${this.get(options.key)}"
                    tooltip="${this.get(options.key)}${options.data?.suffix ?? ""}"
                >
            `;
            this.addInputHTML({ ...options, input });

            $(`#dribbblish-config-input-${options.key}`).on("input", (e) => {
                $(`#dribbblish-config-input-${options.key}`).attr("tooltip", `${e.target.value}${options.data?.suffix ?? ""}`);
                $(`#dribbblish-config-input-${options.key}`).attr("value", e.target.value);

                this.set(options.key, Number(e.target.value), options.save);
                options.onChange(this.get(options.key));
            });
        } else if (options.type == "time") {
            // Validate
            if (options.defaultValue == null) options.defaultValue = "00:00";
            const input = /* html */ `
                <input type="time" id="dribbblish-config-input-${options.key}" name="${options.name}" value="${this.get(options.key)}">
            `;
            this.addInputHTML({ ...options, input });

            $(`#dribbblish-config-input-${options.key}`).on("input", (e) => {
                $(`#dribbblish-config-input-${options.key}`).attr("value", e.target.value);

                this.set(options.key, e.target.value, options.save);
                options.onChange(this.get(options.key));
            });
        } else if (options.type == "color") {
            // Validate
            if (options.defaultValue == null) options.defaultValue = "#000000";
            const input = /* html */ `
                <input type="color" id="dribbblish-config-input-${options.key}" name="${options.name}" value="${this.get(options.key)}">
            `;
            this.addInputHTML({ ...options, input });

            $(`#dribbblish-config-input-${options.key}`).on("input", (e) => {
                this.set(options.key, e.target.value, options.save);
                options.onChange(this.get(options.key));
            });
        } else {
            throw new Error(`Config Type "${options.type}" invalid`);
        }

        // Re-write internal config since some values may have changed
        this.#config[options.key] = options;

        $(`.dribbblish-config-item[key="${options.key}"]`).attr("changed", options.save && this.get(options.key) != options.defaultValue ? "" : null);

        options.children.forEach((child) => this.register(child));

        options.onAppended.call(options);
        if (options.fireInitialChange) options.onChange(this.get(options.key));
    }

    /**
     * @param {DribbblishConfigArea} area
     */
    registerArea(area) {
        /** @type {DribbblishConfigArea} */
        const defaultOptions = {
            toggleable: true,
            order: 0
        };
        area = { ...defaultOptions, ...area };

        if (!document.querySelector(`.dribbblish-config-area[name="${area.name}"]`)) {
            const areaElem = document.createElement("div");
            areaElem.classList.add("dribbblish-config-area");
            if (area.order != 0) areaElem.style.order = area.order;
            const uncollapsedAreas = JSON.parse(localStorage.getItem("dribbblish:config-areas:uncollapsed") ?? "[]");
            if (area.toggleable && !uncollapsedAreas.includes(area.name)) areaElem.toggleAttribute("collapsed");
            areaElem.setAttribute("name", area.name);
            areaElem.innerHTML = /* html */ `
                <h2 class="dribbblish-config-area-header">
                    ${area.name}
                    ${!area.toggleable ? "" : /* html */ `<svg height="24" width="24" viewBox="0 0 24 24" class="main-topBar-icon"><polyline points="16 4 7 12 16 20" fill="none" stroke="currentColor"></polyline></svg>`}
                </h2>
                <div class="dribbblish-config-area-items"></div>
            `;
            document.querySelector(".dribbblish-config-areas").appendChild(areaElem);

            if (area.toggleable) {
                areaElem.querySelector("h2").addEventListener("click", () => {
                    areaElem.toggleAttribute("collapsed");
                    let uncollapsedAreas = JSON.parse(localStorage.getItem("dribbblish:config-areas:uncollapsed") ?? "[]");
                    if (areaElem.hasAttribute("collapsed")) {
                        uncollapsedAreas = uncollapsedAreas.filter((areaName) => areaName != area.name);
                    } else {
                        uncollapsedAreas.push(area.name);
                    }
                    localStorage.setItem("dribbblish:config-areas:uncollapsed", JSON.stringify(uncollapsedAreas));
                });
            }
        }
    }

    /**
     *
     * @param {String} key
     * @param {any} defaultValueOverride
     * @returns {any}
     */
    get(key, defaultValueOverride) {
        const val = JSON.parse(this.#config[key]?.storageCache ?? localStorage.getItem(`dribbblish:config:${key}`) ?? null); // Turn undefined into null because `JSON.parse()` dosen't like undefined
        if (val == null || val?.type != this.#config[key]?.type) {
            localStorage.removeItem(`dribbblish:config:${key}`);
            return defaultValueOverride ?? this.#config[key].defaultValue;
        }
        return val.value;
    }

    /**
     *
     * @param {String} key
     * @param {any} val
     * @param {Boolean} [save=true] if setting should be stored in localStorage
     */
    set(key, val, save = true) {
        val = { type: this.#config[key].type, value: val ?? this.#config[key].defaultValue };
        this.#config[key].storageCache = JSON.stringify(val);
        if (save) localStorage.setItem(`dribbblish:config:${key}`, JSON.stringify(val));
    }

    /**
     *
     * @param {String} key
     */
    reset(key) {
        delete this.#config[key].storageCache;
        localStorage.removeItem(`dribbblish:config:${key}`);
    }

    /**
     *
     * @param {String} key
     * @param {Boolean} hidden
     */
    setHidden(key, hidden) {
        this.#config[key].hidden = hidden;
        $(`.dribbblish-config-item[key="${key}"]`).attr("hidden", hidden ? "" : null);
    }

    getOptions(key) {
        return this.#config[key];
    }

    export() {
        const obj = {
            EXPORTED_WITH: process.env.DRIBBBLISH_VERSION
        };
        Object.entries(this.#config).forEach(([key, options]) => {
            if (options.save) obj[key] = this.get(key);
        });

        return obj;
    }
}
