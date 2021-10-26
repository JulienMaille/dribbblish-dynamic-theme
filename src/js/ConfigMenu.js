export default class ConfigMenu {
    /**
     * @typedef {Object} DribbblishConfigItem
     * @property {"checkbox" | "select" | "button" | "slider" | "number" | "text" | "time" | "color"} type
     * @property {String|DribbblishConfigArea} [area={name: "Main Settings", order: 0}]
     * @property {any} [data={}]
     * @property {Number} [order=0] order < 0 = Higher up | order > 0 = Lower Down
     * @property {String} key
     * @property {String} name
     * @property {String} [description=""]
     * @property {any} [defaultValue]
     * @property {Boolean} [hidden=false]
     * @property {Boolean} [insertOnTop=false]
     * @property {Boolean} [fireInitialChange=true]
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
     */

    /**
     * @callback showChildren
     * @param {any} value
     * @returns {Boolean | String[]}
     */

    /**
     * @callback onAppended
     * @returns {void}
     */

    /**
     * @callback onChange
     * @param {any} value
     * @returns {void}
     */

    /** @type {Object.<string, DribbblishConfigItem>} */
    #config;

    constructor() {
        this.#config = {};
        this.configButton = new Spicetify.Menu.Item("Dribbblish Settings", false, () => this.open());
        this.configButton.register();

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
        document.querySelector(".dribbblish-config-close").addEventListener("click", () => this.close());
        document.querySelector(".dribbblish-config-backdrop").addEventListener("click", () => this.close());
    }

    open() {
        document.getElementById("dribbblish-config").setAttribute("active", "");
    }

    close() {
        document.getElementById("dribbblish-config").removeAttribute("active");
    }

    /**
     * @private
     * @param {DribbblishConfigItem} options
     */
    addInputHTML(options) {
        this.registerArea(options.area);
        const parent = document.querySelector(`.dribbblish-config-area[name="${options.area.name}"] .dribbblish-config-area-items`);

        const elem = document.createElement("div");
        elem.style.order = options.order;
        elem.classList.add("dribbblish-config-item");
        elem.setAttribute("key", options.key);
        elem.setAttribute("type", options.type);
        elem.setAttribute("hidden", options.hidden);
        if (options.childOf) elem.setAttribute("parent", options.childOf);
        elem.innerHTML = /* html */ `
            <h2 class="x-settings-title main-type-cello${!options.description ? " no-desc" : ""}" as="h2">${options.name}</h2>
            <label class="main-type-mesto">${options.description.replace(/\n/g, "<br>")}</label>
            <label class="x-toggle-wrapper x-settings-secondColumn">
                ${options.input}
            </label>
        `;

        if (options.insertOnTop && parent.children.length > 0) {
            parent.insertBefore(elem, parent.children[0]);
        } else {
            parent.appendChild(elem);
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
            insertOnTop: false,
            fireInitialChange: true,
            showChildren: () => true,
            onAppended: () => {},
            onChange: () => {},
            children: [],
            childOf: null
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
            options._onChange(val);
            const show = options.showChildren(val);
            options.children.forEach((child) => this.setHidden(child.key, Array.isArray(show) ? !show.includes(child.key) : !show));
        };
        options.children = options.children.map((child) => {
            return { ...child, area: options.area, childOf: options.key };
        });

        this.#config[options.key] = options;
        this.#config[options.key].value = localStorage.getItem(`dribbblish:config:${options.key}`) ?? JSON.stringify(options.defaultValue);

        if (options.type == "checkbox") {
            const input = /* html */ `
                <input id="dribbblish-config-input-${options.key}" class="x-toggle-input" type="checkbox"${this.get(options.key) ? " checked" : ""}>
                <span class="x-toggle-indicatorWrapper">
                    <span class="x-toggle-indicator"></span>
                </span>
            `;
            this.addInputHTML({ ...options, input });

            document.getElementById(`dribbblish-config-input-${options.key}`).addEventListener("change", (e) => {
                this.set(options.key, e.target.checked);
                options.onChange(this.get(options.key));
            });
        } else if (options.type == "select") {
            // Validate
            const val = this.get(options.key);
            if (val < 0 || val > options.data.length - 1) this.set(options.key);

            const input = /* html */ `
                <select class="main-dropDown-dropDown" id="dribbblish-config-input-${options.key}">
                    ${options.data.map((option, i) => `<option value="${i}"${this.get(options.key) == i ? " selected" : ""}>${option}</option>`).join("")}
                </select>
            `;
            this.addInputHTML({ ...options, input });

            document.getElementById(`dribbblish-config-input-${options.key}`).addEventListener("change", (e) => {
                this.set(options.key, Number(e.target.value));
                options.onChange(this.get(options.key));
            });
        } else if (options.type == "button") {
            options.fireInitialChange = false;
            if (typeof options.data != "string") options.data = options.name;

            const input = /* html */ `
                <button class="main-buttons-button main-button-primary" type="button" id="dribbblish-config-input-${options.key}">
                    <div class="x-settings-buttonContainer">
                        <span>${options.data}</span>
                    </div>
                </button>
            `;
            this.addInputHTML({ ...options, input });

            document.getElementById(`dribbblish-config-input-${options.key}`).addEventListener("click", (e) => {
                options.onChange(true);
            });
        } else if (options.type == "number") {
            // Validate
            if (options.defaultValue == null) options.defaultValue = 0;
            const val = this.get(options.key);
            if (options.data.min != null && val < options.data.min) this.set(options.key, options.data.min);
            if (options.data.max != null && val > options.data.max) this.set(options.key, options.data.max);

            const input = /* html */ `
                <input type="number" id="dribbblish-config-input-${options.key}" value="${this.get(options.key)}">
            `;
            this.addInputHTML({ ...options, input });

            // Prevent inputting +, - and e. Why is it even possible in the first place?
            document.getElementById(`dribbblish-config-input-${options.key}`).addEventListener("keypress", (e) => {
                if (["+", "-", "e"].includes(e.key)) e.preventDefault();
            });

            document.getElementById(`dribbblish-config-input-${options.key}`).addEventListener("input", (e) => {
                if (options.data.min != null && e.target.value < options.data.min) e.target.value = options.data.min;
                if (options.data.max != null && e.target.value > options.data.max) e.target.value = options.data.max;

                this.set(options.key, Number(e.target.value));
                options.onChange(this.get(options.key));
            });
        } else if (options.type == "text") {
            if (options.defaultValue == null) options.defaultValue = "";

            const input = /* html */ `
                <input type="text" id="dribbblish-config-input-${options.key}" value="${this.get(options.key)}">
            `;
            this.addInputHTML({ ...options, input });

            document.getElementById(`dribbblish-config-input-${options.key}`).addEventListener("input", (e) => {
                // TODO: maybe add an validation function via `data.validate`
                this.set(options.key, e.target.value);
                options.onChange(this.get(options.key));
            });
        } else if (options.type == "slider") {
            // Validate
            if (options.defaultValue == null) options.defaultValue = 0;
            const val = this.get(options.key);
            if (options.data.min != null && val < options.data.min) this.set(options.key, options.data.min);
            if (options.data.max != null && val > options.data.max) this.set(options.key, options.data.max);

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

            document.getElementById(`dribbblish-config-input-${options.key}`).addEventListener("input", (e) => {
                document.getElementById(`dribbblish-config-input-${options.key}`).setAttribute("tooltip", `${e.target.value}${options.data?.suffix ?? ""}`);
                document.getElementById(`dribbblish-config-input-${options.key}`).setAttribute("value", e.target.value);
                this.set(options.key, Number(e.target.value));
                options.onChange(this.get(options.key));
            });
        } else if (options.type == "time") {
            // Validate
            if (options.defaultValue == null) options.defaultValue = "00:00";
            const input = /* html */ `
                <input type="time" id="dribbblish-config-input-${options.key}" name="${options.name}" value="${this.get(options.key)}">
            `;
            this.addInputHTML({ ...options, input });

            document.getElementById(`dribbblish-config-input-${options.key}`).addEventListener("input", (e) => {
                document.getElementById(`dribbblish-config-input-${options.key}`).setAttribute("value", e.target.value);
                this.set(options.key, e.target.value);
                options.onChange(this.get(options.key));
            });
        } else if (options.type == "color") {
            // Validate
            if (options.defaultValue == null) options.defaultValue = "#000000";
            const input = /* html */ `
                <input type="color" id="dribbblish-config-input-${options.key}" name="${options.name}" value="${this.get(options.key)}">
            `;
            this.addInputHTML({ ...options, input });

            document.getElementById(`dribbblish-config-input-${options.key}`).addEventListener("input", (e) => {
                this.set(options.key, e.target.value);
                options.onChange(this.get(options.key));
            });
        } else {
            throw new Error(`Config Type "${options.type}" invalid`);
        }

        options.children.forEach((child) => this.register(child));

        options.onAppended();
        if (options.fireInitialChange) options.onChange(this.get(options.key));
    }

    /**
     * @param {DribbblishConfigArea} area
     */
    registerArea(area) {
        if (!document.querySelector(`.dribbblish-config-area[name="${area.name}"]`)) {
            const areaElem = document.createElement("div");
            areaElem.classList.add("dribbblish-config-area");
            areaElem.style.order = area.order;
            const uncollapsedAreas = JSON.parse(localStorage.getItem("dribbblish:config-areas:uncollapsed") ?? "[]");
            if (!uncollapsedAreas.includes(area.name)) areaElem.toggleAttribute("collapsed");
            areaElem.setAttribute("name", area.name);
            areaElem.innerHTML = /* html */ `
                <h2 class="dribbblish-config-area-header">
                    ${area.name}
                    <svg height="24" width="24" viewBox="0 0 24 24" class="main-topBar-icon"><polyline points="16 4 7 12 16 20" fill="none" stroke="currentColor"></polyline></svg>
                </h2>
                <div class="dribbblish-config-area-items"></div>
            `;
            document.querySelector(".dribbblish-config-areas").appendChild(areaElem);
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

    /**
     *
     * @param {String} key
     * @param {any} defaultValueOverride
     * @returns {any}
     */
    get(key, defaultValueOverride) {
        const val = JSON.parse(this.#config[key].value ?? null); // Turn undefined into null because `JSON.parse()` dosen't like undefined
        if (val == null) return defaultValueOverride ?? this.#config[key].defaultValue;
        return val;
    }

    /**
     *
     * @param {String} key
     * @param {any} val
     */
    set(key, val) {
        this.#config[key].value = JSON.stringify(val);
        localStorage.setItem(`dribbblish:config:${key}`, JSON.stringify(val));
    }

    /**
     *
     * @param {String} key
     * @param {Boolean} hidden
     */
    setHidden(key, hidden) {
        this.#config[key].hidden = hidden;
        document.querySelector(`.dribbblish-config-item[key="${key}"]`).setAttribute("hidden", hidden);
    }

    getOptions(key) {
        return this.#config[key];
    }
}