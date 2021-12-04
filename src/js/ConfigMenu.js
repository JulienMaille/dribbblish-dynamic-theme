import $ from "jquery";

import { renderMD } from "./Util";
import { icons } from "./Icons";

export default class ConfigMenu {
    /** @typedef {"checkbox" | "select" | "button" | "slider" | "number" | "text" | "textarea" | "time" | "color"} DribbblishConfigType */

    /**
     * @typedef {Object} DribbblishConfigItem
     * @property {DribbblishConfigType} type
     * @property {String | DribbblishConfigArea} [area={name: "Main Settings", order: 0}]
     * @property {any} [data={}]
     * @property {Number} [order=0] order < 0 = Higher up | order > 0 = Lower Down
     * @property {String} key
     * @property {String} name
     * @property {String} [description=""]
     * @property {any} [defaultValue]
     * @property {Boolean} [hidden=false]
     * @property {Boolean} [resetButton=true]
     * @property {Boolean} [insertOnTop=false]
     * @property {Boolean} [fireInitialChange=true]
     * @property {Boolean} [save=true]
     * @property {validate} [validate]
     * @property {showChildren} [showChildren]
     * @property {onAppended} [onAppended]
     * @property {onChange} [onChange]
     * @property {DribbblishConfigItem[]} [children=[]]
     * @property {String} [parent=null] key of parent (set automatically)
     */

    /**
     * @typedef DribbblishConfigArea
     * @property {String} name
     * @property {Number} [order=0] order < 0 = Higher up | order > 0 = Lower Down
     * @property {Boolean} [toggleable=true]
     */

    /**
     * @callback validate
     * @this {DribbblishConfigItem}
     * @param {any} value
     * @returns {Boolean | String}
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

    /** @type {Spicetify.Menu.Item} */
    #configButton;

    constructor() {
        this.#config = {};
        this.#configButton = new Spicetify.Menu.Item("Dribbblish Settings", false, () => this.open());
        this.#configButton.register();

        const container = document.createElement("div");
        container.id = "dribbblish-config";
        container.innerHTML = /* html */ `
            <div class="dribbblish-config-container">
                <button aria-label="Close" class="dribbblish-config-close main-trackCreditsModal-closeBtn">${icons.get("close", { size: 24 })}</button>
                <h1>Dribbblish Settings</h1>
                <input type="search" placeholder="Search" class="dribbblish-config-search">
                <div class="dribbblish-config-areas"></div>
            </div>
            <div class="dribbblish-config-backdrop"></div>
        `;

        document.body.appendChild(container);
        $(".dribbblish-config-close").on("click", () => this.close());
        $(".dribbblish-config-backdrop").on("click", () => this.close());
        $(".dribbblish-config-search").on("input", (e) => this.#search(e.target.value));
    }

    open() {
        $("#dribbblish-config").attr("active", true);
    }

    close() {
        $("#dribbblish-config").removeAttr("active");
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
            validate: () => true,
            showChildren: () => true,
            onAppended: () => {},
            onChange: () => {},
            children: [],
            parent: null
        };
        // Set Defaults
        options = { ...defaultOptions, ...options };
        if (typeof options.area == "string") options.area = { name: options.area, order: 0 };
        options.description = options.description
            .split("\n")
            .filter((line) => line.trim() != "")
            .map((line) => line.trim())
            .join("\n");
        options._onChange = options.onChange;
        options.onChange = (val) => {
            const isValid = validate(val) === true;
            $(`.dribbblish-config-item[key="${options.key}"]`).attr("changed", options.type != "button" && isValid && val != options.defaultValue ? "" : null);
            if (!isValid) return;
            this.set(options.key, val, options.save);

            options._onChange.call(options, val);
            const show = options.showChildren.call(options, val);
            options.children.forEach((child) => this.setHidden(child.key, Array.isArray(show) ? !show.includes(child.key) : !show));
        };
        options.children = options.children.map((child) => {
            return { ...child, area: options.area, parent: options.key, order: options.order ?? 0 + child.order ?? 0 };
        });

        this.#config[options.key] = options;

        function validate(val) {
            const isValid = options.validate.call(options, val);
            const $elem = $(`.dribbblish-config-item[key="${options.key}"]`);
            if (isValid === true) {
                $elem.attr("invalid", null).css("--validation-error", "");
            } else {
                const error = isValid === false ? "Invalid" : isValid;
                $elem.attr("invalid", "").css("--validation-error", `"${error.replace(/"/g, `\\"`)}"`);
            }
            return isValid;
        }

        let elem;
        let input;
        if (options.type == "checkbox") {
            elem = document.createDocumentFragment();

            input = document.createElement("input");
            input.classList.add("dribbblish-config-input");
            input.type = "checkbox";
            input.classList.add("x-toggle-input");
            input.checked = this.get(options.key);
            input.addEventListener("change", (e) => {
                options.onChange(e.target.checked);
            });
            elem.appendChild(input);

            const indicator = document.createElement("span");
            indicator.classList.add("x-toggle-indicatorWrapper");
            indicator.innerHTML = /* html */ `<span class="x-toggle-indicator"></span>`;
            elem.appendChild(indicator);
        } else if (options.type == "select") {
            input = document.createElement("select");
            input.classList.add("dribbblish-config-input");
            input.classList.add("main-dropDown-dropDown");
            input.innerHTML = Object.entries(options.data)
                .map(([key, name]) => `<option value="${key}"${this.get(options.key) == key ? " selected" : ""}>${name}</option>`)
                .join("");
            input.addEventListener("change", (e) => {
                options.onChange(e.target.value);
            });
        } else if (options.type == "button") {
            if (typeof options.data != "string") options.data = options.name;
            options.fireInitialChange = false;
            options.resetButton = false;
            options.save = false;

            input = document.createElement("button");
            input.classList.add("dribbblish-config-input");
            input.type = "button";
            input.classList.add("main-buttons-button", "main-button-primary");
            input.innerHTML = /* html */ `<div class="x-settings-buttonContainer"><span>${options.data}</span></div>`;
            input.addEventListener("click", (e) => {
                options.onChange(true);
            });
        } else if (options.type == "number") {
            // Validate
            if (options.defaultValue == null) options.defaultValue = 0;
            const _val = this.get(options.key);
            if (options.data.min != null && _val < options.data.min) this.set(options.key, options.data.min, options.save);
            if (options.data.max != null && _val > options.data.max) this.set(options.key, options.data.max, options.save);

            input = document.createElement("input");
            input.classList.add("dribbblish-config-input");
            input.type = "number";
            input.value = this.get(options.key);
            input.step = options.data.step ?? 1;
            if (options.data.min != null) input.min = options.data.min;
            if (options.data.max != null) input.max = options.data.max;
            input.addEventListener("keypress", (e) => {
                // Prevent inputting + and e.
                if (["+", "e"].includes(e.key)) e.preventDefault();
            });
            input.addEventListener("input", (e) => {
                if (options.data.min != null && e.target.value < options.data.min) e.target.value = options.data.min;
                if (options.data.max != null && e.target.value > options.data.max) e.target.value = options.data.max;

                options.onChange(Number(e.target.value));
            });
        } else if (options.type == "text") {
            if (options.defaultValue == null) options.defaultValue = "";

            input = document.createElement("input");
            input.classList.add("dribbblish-config-input");
            input.type = "text";
            input.value = this.get(options.key);
            input.addEventListener("input", (e) => {
                options.onChange(e.target.value);
            });
        } else if (options.type == "textarea") {
            if (options.defaultValue == null) options.defaultValue = "";

            input = document.createElement("textarea");
            input.classList.add("dribbblish-config-input");
            input.value = this.get(options.key);
            input.addEventListener("input", (e) => {
                options.onChange(e.target.value);
            });
        } else if (options.type == "slider") {
            // Validate
            if (options.defaultValue == null) options.defaultValue = 0;
            const val = this.get(options.key);
            if (options.data.min != null && val < options.data.min) this.set(options.key, options.data.min, options.save);
            if (options.data.max != null && val > options.data.max) this.set(options.key, options.data.max, options.save);

            input = document.createElement("input");
            input.classList.add("dribbblish-config-input");
            input.type = "range";
            input.step = options.data.step ?? 1;
            input.min = options.data.min ?? 0;
            input.max = options.data.max ?? 100;
            input.value = this.get(options.key);
            input.setAttribute("tooltip", `${this.get(options.key)}${options.data.suffix ?? ""}`);
            input.addEventListener("input", (e) => {
                options.onChange(Number(e.target.value));
                $(`#dribbblish-config-input-${options.key}`).attr("tooltip", `${e.target.value}${options.data?.suffix ?? ""}`);
            });
        } else if (options.type == "time") {
            // Validate
            if (options.defaultValue == null) options.defaultValue = "00:00";

            input = document.createElement("input");
            input.classList.add("dribbblish-config-input");
            input.type = "time";
            input.value = this.get(options.key);
            input.addEventListener("input", (e) => {
                options.onChange(e.target.value);
            });
        } else if (options.type == "color") {
            // Validate
            if (options.defaultValue == null) options.defaultValue = "#000000";

            input = document.createElement("input");
            input.classList.add("dribbblish-config-input");
            input.type = "color";
            input.value = this.get(options.key);
            input.addEventListener("input", (e) => {
                options.onChange(e.target.value);
            });
        } else {
            throw new Error(`Config Type "${options.type}" invalid`);
        }

        this.#addInputHTML({ ...options, input: elem ?? input });
        options.input = input;

        // Re-write internal config since some values may have changed
        this.#config[options.key] = options;

        validate(this.get(options.key));
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
            this.#addAreaHTML(area);
        } else {
            throw new Error(`Area "${area.name}" already exists`);
        }
    }

    /**
     *
     * @param {String} key
     * @param {any} defaultValueOverride
     * @returns {any}
     */
    get(key, defaultValueOverride) {
        const val = JSON.parse(this.#config[key]?.storageCache ?? localStorage.getItem(`dribbblish:config:${key}`) ?? null); // Turn undefined into null because `JSON.parse()` doesn't like undefined
        if (val == null || val?.type != this.#config[key]?.type) {
            localStorage.removeItem(`dribbblish:config:${key}`);
            return defaultValueOverride ?? this.#config[key]?.defaultValue;
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

        const options = this.#config[key];
        const defaultVal = this.get(options.key);
        if (options.type == "checkbox") {
            options.input.checked = defaultVal;
        } else {
            options.input.value = defaultVal;
            if (options.type == "slider") options.input.setAttribute("tooltip", `${defaultVal}${options.data.suffix ?? ""}`);
        }

        options.onChange(defaultVal);
    }

    /**
     *
     * @param {String} key
     * @param {Boolean} hidden
     * @private
     */
    setHidden(key, hidden, search = false) {
        this.#config[key].hidden = hidden;
        const $elem = $(`.dribbblish-config-item[key="${key}"]`);
        $elem.attr(search ? "hidden-override" : "hidden", hidden ? "" : null);

        // If element has children or a parent
        if ($elem.attr("parent") != null || $elem.attr("children") != null) {
            // Get parent of element block
            const $parent = $elem.attr("parent") != null ? $(`[children~="${key}"]`) : $elem;
            const $nextChildren = $parent.nextAll(`[parent="${$parent.attr("key")}"]`);

            // Make parent connect on bottom when children are visible
            $parent.attr("connect-bottom", $nextChildren.filter(":not([hidden]):not([hidden-override])").length > 0 ? "" : null);

            // Reset all children's bottom connection
            $nextChildren.each(function () {
                $(this).attr("connect-bottom", null);
            });
            // Add bottom connection to all but the last visible child
            $nextChildren
                .filter(":not([hidden]):not([hidden-override])")
                .slice(0, -1)
                .each(function () {
                    $(this).attr("connect-bottom", "");
                });

            //* NOTE: All children automatically have a top connection
        }
    }

    setDisabled(key, disabled) {
        this.#config[key].input.disabled = disabled;
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

    /**
     * @param {String} text
     */
    #search(text) {
        text = text.trim().toLowerCase();
        $(".dribbblish-config-area-header svg").css("display", text != "" ? "none" : "");
        $(".dribbblish-config-area").attr("search", text != "" ? "" : null);

        const cmp = (s) => s.trim().toLowerCase().includes(text.trim().toLowerCase());
        /**
         * @param {DribbblishConfigItem} options
         */
        function cmpOpts(options) {
            let matches = cmp(options.name) || cmp($(`.dribbblish-config-item[key="${options.key}"] .dribbblish-config-item-header label`).text());
            if (!matches && options.type == "select") matches = Object.values(options.data).some(cmp);
            return matches;
        }

        // Check every item
        for (const [key, options] of Object.entries(this.#config)) {
            this.setHidden(key, false, true);
            if (text == "") continue;

            const show = cmpOpts(options);
            this.setHidden(key, !show, true);
        }

        // Check every item's children and show it when any child is visible
        for (const [key, options] of Object.entries(this.#config)) {
            if (options.children.length != 0 && $(`.dribbblish-config-item[parent="${options.key}"]`).filter(":not([hidden]):not([hidden-override])").length != 0) this.setHidden(key, false, true);
        }

        // Hide areas without visible children
        for (const area of $(".dribbblish-config-area").toArray()) {
            const $area = $(area);
            const itemsVisible = $area.children(".dribbblish-config-area-items").children(":not([hidden]):not([hidden-override])").length;
            $area.css("display", text != "" && itemsVisible == 0 ? "none" : "");
        }

        $(`.dribbblish-config-item`).filter(":not([hidden]):not([hidden-override])").length;
    }

    /**
     * @private
     * @param {DribbblishConfigItem} options
     */
    #addInputHTML(options) {
        if (!document.querySelector(`.dribbblish-config-area[name="${options.area.name}"]`)) this.registerArea(options.area);

        const parent = document.querySelector(`.dribbblish-config-area[name="${options.area.name}"] .dribbblish-config-area-items`);

        const elem = document.createElement("div");
        if (options.order != 0) elem.style.order = options.order;
        elem.classList.add("dribbblish-config-item");
        elem.setAttribute("key", options.key);
        elem.setAttribute("type", options.type);
        if (options.hidden) elem.setAttribute("hidden", true);
        if (options.parent) elem.setAttribute("parent", options.parent);
        if (options.children.length > 0) elem.setAttribute("children", options.children.map((c) => c.key).join(" "));
        elem.innerHTML = /* html */ `
                ${
                    options.name != null && options.description != null
                        ? /* html */ `
                            <div class="dribbblish-config-item-header">
                                <h2 class="x-settings-title main-type-cello" as="h2" empty="${options.name == null}">${options.name}</h2>
                                <label class="main-type-mesto" empty="${options.description == null}" markdown>${renderMD(options.description)}</label>
                            </div>
                        `
                        : ""
                }
                <div class="dribbblish-config-item-input">
                    <label class="x-toggle-wrapper x-settings-secondColumn"></label>
                </div>
            `;

        elem.querySelector(".dribbblish-config-item-input > label").appendChild(options.input);

        if (options.resetButton && options.name != null && options.description != null) {
            const resetBtn = document.createElement("button");
            resetBtn.ariaLabel = "Reset";
            resetBtn.className = "dribbblish-config-item-reset main-trackCreditsModal-closeBtn";
            resetBtn.innerHTML = icons.get("delete-outline", { size: 20, title: "Reset Setting" });
            resetBtn.addEventListener("click", () => {
                this.reset(options.key);
            });

            elem.querySelector(".dribbblish-config-item-header > h2").appendChild(resetBtn);
        }

        if (options.insertOnTop && parent.children.length > 0) {
            parent.insertBefore(elem, parent.children[0]);
        } else {
            parent.appendChild(elem);
        }
    }

    /**
     *
     * @param {DribbblishConfigArea} area
     */
    #addAreaHTML(area) {
        const areaElem = document.createElement("div");
        areaElem.classList.add("dribbblish-config-area");
        if (area.order != 0) areaElem.style.order = area.order;
        const uncollapsedAreas = JSON.parse(localStorage.getItem("dribbblish:config-areas:uncollapsed") ?? "[]");
        if (area.toggleable && !uncollapsedAreas.includes(area.name)) areaElem.toggleAttribute("collapsed");
        areaElem.setAttribute("name", area.name);
        areaElem.innerHTML = /* html */ `
                    <h2 class="dribbblish-config-area-header">
                        ${area.name}
                        ${!area.toggleable ? "" : icons.get("expand-more", { size: 24, scale: 1.2 })}
                    </h2>
                    <div class="dribbblish-config-area-items"></div>
                `;
        document.querySelector(".dribbblish-config-areas").appendChild(areaElem);

        if (area.toggleable) {
            areaElem.querySelector("h2").addEventListener("click", () => {
                if (document.querySelector(".dribbblish-config-search").value.trim() != "") return;

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
