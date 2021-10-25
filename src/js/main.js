import * as Vibrant from "node-vibrant";

// Hide popover message
// document.getElementById("popover-container").style.height = 0;
class ConfigMenu {
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
        this.configButton = new Spicetify.Menu.Item("Dribbblish Settings", false, () => DribbblishShared.config.open());
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
        document.querySelector(".dribbblish-config-close").addEventListener("click", () => DribbblishShared.config.close());
        document.querySelector(".dribbblish-config-backdrop").addEventListener("click", () => DribbblishShared.config.close());
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

class _DribbblishShared {
    constructor() {
        this.config = new ConfigMenu();
    }
}
const DribbblishShared = new _DribbblishShared();

DribbblishShared.config.register({
    type: "checkbox",
    key: "rightBigCover",
    name: "Right expanded cover",
    description: "Have the expanded cover Image on the right instead of on the left",
    defaultValue: true,
    onChange: (val) => {
        if (val) {
            document.documentElement.classList.add("right-expanded-cover");
        } else {
            document.documentElement.classList.remove("right-expanded-cover");
        }
    }
});

DribbblishShared.config.register({
    type: "checkbox",
    key: "roundSidebarIcons",
    name: "Round Sidebar Icons",
    description: "If the Sidebar Icons should be round instead of square",
    defaultValue: false,
    onChange: (val) => document.documentElement.style.setProperty("--sidebar-icons-border-radius", val ? "50%" : "var(--image-radius)")
});

DribbblishShared.config.register({
    area: "Animations & Transitions",
    type: "checkbox",
    key: "sidebarHoverAnimation",
    name: "Sidebar Hover Animation",
    description: "If the Sidebar Icons should have an animated background on hover",
    defaultValue: true,
    onChange: (val) => document.documentElement.style.setProperty("--sidebar-icons-hover-animation", val ? "1" : "0")
});

waitForElement(["#main"], () => {
    DribbblishShared.config.register({
        type: "select",
        data: ["None", "None (With Top Padding)", "Solid", "Transparent"],
        key: "winTopBar",
        name: "Windows Top Bar",
        description: "Have different top Bars (or none at all)",
        defaultValue: 0,
        onChange: (val) => {
            switch (val) {
                case 0:
                    document.getElementById("main").setAttribute("top-bar", "none");
                    break;
                case 1:
                    document.getElementById("main").setAttribute("top-bar", "none-padding");
                    break;
                case 2:
                    document.getElementById("main").setAttribute("top-bar", "solid");
                    break;
                case 3:
                    document.getElementById("main").setAttribute("top-bar", "transparent");
                    break;
            }
        }
    });

    DribbblishShared.config.register({
        type: "select",
        data: ["Dribbblish", "Spotify"],
        key: "playerControlsStyle",
        name: "Player Controls Style",
        description: "Style of the Player Controls. Selecting Spotify basically changes Play / Pause back to the center",
        defaultValue: 0,
        onChange: (val) => {
            switch (val) {
                case 0:
                    document.getElementById("main").setAttribute("player-controls", "dribbblish");
                    break;
                case 1:
                    document.getElementById("main").setAttribute("player-controls", "spotify");
                    break;
            }
        }
    });

    DribbblishShared.config.register({
        area: "Ads",
        type: "checkbox",
        key: "hideAds",
        name: "Hide Ads",
        description: `Hide ads / premium features (see: <a href="https://github.com/Daksh777/SpotifyNoPremium">SpotifyNoPremium</a>)`,
        defaultValue: false,
        onAppended: () => {
            document.styleSheets[0].insertRule(/* css */ `
                /* Remove upgrade button*/
                #main[hide-ads] .main-topBar-UpgradeButton {
                    display: none
                }
            `);
            document.styleSheets[0].insertRule(/* css */ `
                /* Remove upgrade to premium button in user menu */
                #main[hide-ads] .main-contextMenu-menuItemButton[href="https://www.spotify.com/premium/"] {
                    display: none
                }
            `);
            document.styleSheets[0].insertRule(/* css */ `
                /* Remove ad placeholder in main screen */
                #main[hide-ads] .main-leaderboardComponent-container {
                    display: none
                }
            `);
        },
        onChange: (val) => document.getElementById("main").toggleAttribute("hide-ads", val)
    });
});

function waitForElement(els, func, timeout = 100) {
    const queries = els.map((el) => document.querySelector(el));
    if (queries.every((a) => a)) {
        func(queries);
    } else if (timeout > 0) {
        setTimeout(waitForElement, 300, els, func, --timeout);
    }
}

waitForElement([`.main-rootlist-rootlistPlaylistsScrollNode ul[tabindex="0"]`, `.main-rootlist-rootlistPlaylistsScrollNode ul[tabindex="0"] li`], ([root, firstItem]) => {
    const listElem = firstItem.parentElement;
    root.classList.add("dribs-playlist-list");

    /** Replace Playlist name with their pictures */
    function loadPlaylistImage() {
        for (const item of listElem.children) {
            let link = item.querySelector("a");
            if (!link) continue;

            let [_, app, uid] = link.pathname.split("/");
            let uri;
            if (app === "playlist") {
                uri = Spicetify.URI.playlistV2URI(uid);
            } else if (app === "folder") {
                const base64 = localStorage.getItem("dribbblish:folder-image:" + uid);
                let img = link.querySelector("img");
                if (!img) {
                    img = document.createElement("img");
                    img.classList.add("playlist-picture");
                    link.prepend(img);
                }
                img.src = base64 || "/images/tracklist-row-song-fallback.svg";
                continue;
            }

            Spicetify.CosmosAsync.get(`sp://core-playlist/v1/playlist/${uri.toURI()}/metadata`, { policy: { picture: true } }).then((res) => {
                const meta = res.metadata;
                let img = link.querySelector("img");
                if (!img) {
                    img = document.createElement("img");
                    img.classList.add("playlist-picture");
                    link.prepend(img);
                }
                img.src = meta.picture || "/images/tracklist-row-song-fallback.svg";
            });
        }
    }

    DribbblishShared.loadPlaylistImage = loadPlaylistImage;
    loadPlaylistImage();

    new MutationObserver(loadPlaylistImage).observe(listElem, { childList: true });
});

waitForElement([".main-rootlist-rootlist", ".main-rootlist-wrapper > :nth-child(2) > :first-child", "#spicetify-show-list"], ([rootlist]) => {
    function checkSidebarPlaylistScroll() {
        const topDist = rootlist.getBoundingClientRect().top - document.querySelector("#spicetify-show-list:not(:empty), .main-rootlist-wrapper > :nth-child(2) > :first-child").getBoundingClientRect().top;
        const bottomDist = document.querySelector(".main-rootlist-wrapper > :nth-child(2) > :last-child").getBoundingClientRect().bottom - rootlist.getBoundingClientRect().bottom;

        rootlist.classList.remove("no-top-shadow", "no-bottom-shadow");
        if (topDist < 10) rootlist.classList.add("no-top-shadow");
        if (bottomDist < 10) rootlist.classList.add("no-bottom-shadow");
    }
    checkSidebarPlaylistScroll();

    // Use Interval because scrolling takes a while and getBoundingClientRect() gets position at the moment of calling, so the interval keeps calling for 1s
    let c = 0;
    let interval;
    rootlist.addEventListener("wheel", () => {
        checkSidebarPlaylistScroll();
        c = 0;
        if (interval == null)
            interval = setInterval(() => {
                if (c > 20) {
                    clearInterval(interval);
                    interval = null;
                    return;
                }

                checkSidebarPlaylistScroll();
                c++;
            }, 50);
    });
});

waitForElement([".Root__main-view"], ([mainView]) => {
    const shadow = document.createElement("div");
    shadow.id = "dribbblish-back-shadow";
    mainView.prepend(shadow);
});

waitForElement([".Root__nav-bar .LayoutResizer__input, .Root__nav-bar .LayoutResizer__resize-bar input"], ([resizer]) => {
    const observer = new MutationObserver(updateVariable);
    observer.observe(resizer, { attributes: true, attributeFilter: ["value"] });
    function updateVariable() {
        let value = resizer.value;
        if (value < 121) {
            value = 72;
            document.documentElement.classList.add("sidebar-hide-text");
        } else {
            document.documentElement.classList.remove("sidebar-hide-text");
        }
        document.documentElement.style.setProperty("--sidebar-width", value + "px");
    }
    updateVariable();
});

waitForElement([".Root__main-view .os-resize-observer-host"], ([resizeHost]) => {
    const observer = new ResizeObserver(updateVariable);
    observer.observe(resizeHost);
    function updateVariable([event]) {
        document.documentElement.style.setProperty("--main-view-width", event.contentRect.width + "px");
        document.documentElement.style.setProperty("--main-view-height", event.contentRect.height + "px");
        if (event.contentRect.width < 700) {
            document.documentElement.classList.add("minimal-player");
        } else {
            document.documentElement.classList.remove("minimal-player");
        }
        if (event.contentRect.width < 550) {
            document.documentElement.classList.add("extra-minimal-player");
        } else {
            document.documentElement.classList.remove("extra-minimal-player");
        }
    }
});

(function Dribbblish() {
    const progBar = document.querySelector(".playback-bar");
    const root = document.querySelector(".Root");

    if (!Spicetify.Player.origin || !progBar || !root) {
        setTimeout(Dribbblish, 300);
        return;
    }

    const progKnob = progBar.querySelector(".progress-bar__slider");

    const tooltip = document.createElement("div");
    tooltip.className = "prog-tooltip";
    progKnob.append(tooltip);

    function updateProgTime(timeOverride) {
        const newText = Spicetify.Player.formatTime(timeOverride || Spicetify.Player.getProgress()) + " / " + Spicetify.Player.formatTime(Spicetify.Player.getDuration());
        // To reduce DOM Updates when the Song is Paused
        if (tooltip.innerText != newText) tooltip.innerText = newText;
    }
    const knobPosObserver = new MutationObserver((muts) => {
        const progressPercentage = Number(getComputedStyle(document.querySelector(".progress-bar")).getPropertyValue("--progress-bar-transform").replace("%", "")) / 100;
        updateProgTime(Spicetify.Player.getDuration() * progressPercentage);
    });
    knobPosObserver.observe(document.querySelector(".progress-bar"), {
        attributes: true,
        attributeFilter: ["style"]
    });
    Spicetify.Player.addEventListener("songchange", () => updateProgTime());
    updateProgTime();

    Spicetify.CosmosAsync.sub("sp://connect/v1", (state) => {
        const isExternal = state.devices.some((a) => a.is_active);
        if (isExternal) {
            root.classList.add("is-connectBarVisible");
        } else {
            root.classList.remove("is-connectBarVisible");
        }
    });

    const filePickerForm = document.createElement("form");
    filePickerForm.setAttribute("aria-hidden", true);
    filePickerForm.innerHTML = '<input type="file" class="hidden-visually" />';
    document.body.appendChild(filePickerForm);
    /** @type {HTMLInputElement} */
    const filePickerInput = filePickerForm.childNodes[0];
    filePickerInput.accept = ["image/jpeg", "image/apng", "image/avif", "image/gif", "image/png", "image/svg+xml", "image/webp"].join(",");

    filePickerInput.onchange = () => {
        if (!filePickerInput.files.length) return;

        const file = filePickerInput.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target.result;
            const id = Spicetify.URI.from(filePickerInput.uri).id;
            try {
                localStorage.setItem("dribbblish:folder-image:" + id, result);
            } catch {
                Spicetify.showNotification("File too large");
            }
            DribbblishShared.loadPlaylistImage?.call();
        };
        reader.readAsDataURL(file);
    };

    new Spicetify.ContextMenu.Item(
        "Remove folder image",
        ([uri]) => {
            const id = Spicetify.URI.from(uri).id;
            localStorage.removeItem("dribbblish:folder-image:" + id);
            DribbblishShared.loadPlaylistImage?.call();
        },
        ([uri]) => Spicetify.URI.isFolder(uri),
        "x"
    ).register();
    new Spicetify.ContextMenu.Item(
        "Choose folder image",
        ([uri]) => {
            filePickerInput.uri = uri;
            filePickerForm.reset();
            filePickerInput.click();
        },
        ([uri]) => Spicetify.URI.isFolder(uri),
        "edit"
    ).register();
})();

let current = "2.6.0";

/* Config settings */

DribbblishShared.config.register({
    area: "Animations & Transitions",
    type: "slider",
    key: "fadeDuration",
    name: "Color Fade Duration",
    description: "Select the duration of the color fading transition",
    defaultValue: 0.5,
    data: {
        min: 0,
        max: 10,
        step: 0.1,
        suffix: "s"
    },
    onChange: (val) => document.documentElement.style.setProperty("--song-transition-speed", val + "s")
});

// waitForElement because Spicetify is not initialized at startup
waitForElement(["#main"], () => {
    DribbblishShared.config.register({
        area: { name: "About", order: 999 },
        type: "button",
        key: "aboutDribbblish",
        name: "Info",
        description: `
            OS: ${capitalizeFirstLetter(Spicetify.Platform.PlatformData.os_name)} v${Spicetify.Platform.PlatformData.os_version}
            Spotify: v${Spicetify.Platform.PlatformData.event_sender_context_information?.client_version_string ?? Spicetify.Platform.PlatformData.client_version_triple}
            Dribbblish: v${current}
        `,
        data: "Copy",
        onChange: (val) => {
            copyToClipboard(DribbblishShared.config.getOptions("aboutDribbblish").description);
            Spicetify.showNotification("Copied Versions");
        }
    });
});

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function copyToClipboard(text) {
    var input = document.createElement("textarea");
    input.style.display = "fixed";
    input.innerHTML = text;
    document.body.appendChild(input);
    input.select();
    var result = document.execCommand("copy");
    document.body.removeChild(input);
    return result;
}

/* js */
function getAlbumInfo(uri) {
    return Spicetify.CosmosAsync.get(`hm://album/v1/album-app/album/${uri}/desktop`);
}

function isLight(hex) {
    var [r, g, b] = hexToRgb(hex).map(Number);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
}

function hexToRgb(hex) {
    var bigint = parseInt(hex.replace("#", ""), 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;
    return [r, g, b];
}

function rgbToHex([r, g, b]) {
    const rgb = (r << 16) | (g << 8) | (b << 0);
    return "#" + (0x1000000 + rgb).toString(16).slice(1);
}

const LightenDarkenColor = (h, p) =>
    "#" +
    [1, 3, 5]
        .map((s) => parseInt(h.substr(s, 2), 16))
        .map((c) => parseInt((c * (100 + p)) / 100))
        .map((c) => (c < 255 ? c : 255))
        .map((c) => c.toString(16).padStart(2, "0"))
        .join("");

function rgbToHsl([r, g, b]) {
    (r /= 255), (g /= 255), (b /= 255);
    var max = Math.max(r, g, b),
        min = Math.min(r, g, b);
    var h,
        s,
        l = (max + min) / 2;
    if (max == min) {
        h = s = 0; // achromatic
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }
    return [h, s, l];
}

function hslToRgb([h, s, l]) {
    var r, g, b;
    if (s == 0) {
        r = g = b = l; // achromatic
    } else {
        function hue2rgb(p, q, t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [r * 255, g * 255, b * 255];
}

function setLightness(hex, lightness) {
    let hsl = rgbToHsl(hexToRgb(hex));
    hsl[2] = lightness;
    return rgbToHex(hslToRgb(hsl));
}

function parseComputedStyleColor(col) {
    if (col.startsWith("#")) return col;
    if (col.startsWith("rgb("))
        return rgbToHex(
            col
                .replace(/rgb|(|)/g, "")
                .split(",")
                .map((part) => Number(part.trim()))
        );
}

// `parseComputedStyleColor()` beacuse "--spice-sidebar" is `rgb()`
let textColor = parseComputedStyleColor(getComputedStyle(document.documentElement).getPropertyValue("--spice-text"));
let textColorBg = parseComputedStyleColor(getComputedStyle(document.documentElement).getPropertyValue("--spice-main"));
let sidebarColor = parseComputedStyleColor(getComputedStyle(document.documentElement).getPropertyValue("--spice-sidebar"));

function setRootColor(name, colHex) {
    let root = document.documentElement;
    if (root === null) return;
    root.style.setProperty("--spice-" + name, colHex);
    root.style.setProperty("--spice-rgb-" + name, hexToRgb(colHex).join(","));
}

function toggleDark(setDark) {
    if (setDark === undefined) setDark = isLight(textColorBg);

    document.documentElement.style.setProperty("--is_light", setDark ? 0 : 1);
    textColorBg = setDark ? "#0A0A0A" : "#FAFAFA";

    setRootColor("main", textColorBg);
    setRootColor("player", textColorBg);
    setRootColor("card", setDark ? "#040404" : "#ECECEC");
    setRootColor("subtext", setDark ? "#EAEAEA" : "#3D3D3D");
    setRootColor("notification", setDark ? "#303030" : "#DDDDDD");

    updateColors(textColor, sidebarColor, false);
}

function checkDarkLightMode(colors) {
    const theme = DribbblishShared.config.get("theme");
    if (theme == 2) {
        // Based on Time
        const start = 60 * parseInt(DribbblishShared.config.get("darkModeOnTime").split(":")[0]) + parseInt(DribbblishShared.config.get("darkModeOnTime").split(":")[1]);
        const end = 60 * parseInt(DribbblishShared.config.get("darkModeOffTime").split(":")[0]) + parseInt(DribbblishShared.config.get("darkModeOffTime").split(":")[1]);

        const now = new Date();
        const time = 60 * now.getHours() + now.getMinutes();

        let dark;
        if (end < start) dark = start <= time || time < end;
        else dark = start <= time && time < end;
        toggleDark(dark);
    } else if (theme == 3) {
        // Based on Color
        if (colors && colors.length > 0) toggleDark(isLight(colors[0]));
    }
}
// Run every Minute to check time and set dark / light mode
setInterval(checkDarkLightMode, 60000);

DribbblishShared.config.register({
    area: "Theme",
    type: "checkbox",
    key: "dynamicColors",
    name: "Dynamic",
    description: "If the Theme's Color should be extracted from Albumart",
    defaultValue: true,
    onChange: (val) => updateColors(),
    showChildren: (val) => !val,
    children: [
        {
            type: "color",
            key: "colorOverride",
            name: "Color",
            description: "The Color of the Theme",
            defaultValue: "#1ed760",
            fireInitialChange: false,
            onChange: (val) => updateColors()
        }
    ]
});

DribbblishShared.config.register({
    area: "Theme",
    type: "select",
    data: ["Dark", "Light", "Based on Time", "Based on Color"],
    key: "theme",
    name: "Theme",
    description: "Select Dark / Bright mode",
    defaultValue: 0,
    showChildren: (val) => {
        if (val == 2) return ["darkModeOnTime", "darkModeOffTime"];
        //if (val == 3) return [""];
        return false;
    },
    onChange: (val) => {
        switch (val) {
            case 0:
                toggleDark(true);
                break;
            case 1:
                toggleDark(false);
                break;
            case 2:
                checkDarkLightMode();
                break;
            case 3:
                checkDarkLightMode();
                break;
        }
    },
    children: [
        {
            type: "time",
            key: "darkModeOnTime",
            name: "Dark Mode On Time",
            description: "Beginning of Dark mode time",
            defaultValue: "20:00",
            fireInitialChange: false,
            onChange: checkDarkLightMode
        },
        {
            type: "time",
            key: "darkModeOffTime",
            name: "Dark Mode Off Time",
            description: "End of Dark mode time",
            defaultValue: "06:00",
            fireInitialChange: false,
            onChange: checkDarkLightMode
        }
    ]
});

var currentColor;
var currentSideColor;

function updateColors(textColHex, sideColHex, checkDarkMode = true) {
    if (textColHex && sideColHex) {
        currentColor = textColHex;
        currentSideColor = sideColHex;
    } else {
        if (!(currentColor && currentSideColor)) return; // If `updateColors()` is called early these vars are undefined and would break
        textColHex = currentColor;
        sideColHex = currentSideColor;
    }

    if (!DribbblishShared.config.get("dynamicColors")) {
        const col = DribbblishShared.config.get("colorOverride");
        textColHex = col;
        sideColHex = col;
    }

    let isLightBg = isLight(textColorBg);
    if (isLightBg) textColHex = LightenDarkenColor(textColHex, -15); // vibrant color is always too bright for white bg mode

    let darkColHex = LightenDarkenColor(textColHex, isLightBg ? 12 : -20);
    let darkerColHex = LightenDarkenColor(textColHex, isLightBg ? 30 : -40);
    let buttonBgColHex = setLightness(textColHex, isLightBg ? 0.9 : 0.14);
    setRootColor("text", textColHex);
    setRootColor("button", darkerColHex);
    setRootColor("button-active", darkColHex);
    setRootColor("selected-row", darkerColHex);
    setRootColor("tab-active", buttonBgColHex);
    setRootColor("button-disabled", buttonBgColHex);
    setRootColor("sidebar", sideColHex);

    if (checkDarkMode) checkDarkLightMode([textColHex, sideColHex]);
}

let nearArtistSpan;
let nearArtistSpanText = "";
let coverListenerInstalled = true;
async function songchange() {
    try {
        // warning popup
        if (Spicetify.Platform.PlatformData.client_version_triple < "1.1.68") Spicetify.showNotification(`Your version of Spotify ${Spicetify.Platform.PlatformData.client_version_triple}) is un-supported`);
    } catch (err) {
        console.error(err);
    }

    let album_uri = Spicetify.Player.data.track.metadata.album_uri;
    let bgImage = Spicetify.Player.data.track.metadata.image_url;
    if (bgImage === undefined) {
        bgImage = "/images/tracklist-row-song-fallback.svg";
        textColor = "#509bf5";
        updateColors(textColor, textColor);
        coverListenerInstalled = false;
    }
    if (!coverListenerInstalled) hookCoverChange(true);

    if (album_uri !== undefined && !album_uri.includes("spotify:show")) {
        const albumInfo = await getAlbumInfo(album_uri.replace("spotify:album:", ""));

        let album_date = new Date(albumInfo.year, (albumInfo.month || 1) - 1, albumInfo.day || 0);
        let recent_date = new Date();
        recent_date.setMonth(recent_date.getMonth() - 6);
        album_date = album_date.toLocaleString("default", album_date > recent_date ? { year: "numeric", month: "short" } : { year: "numeric" });
        let album_link = '<a title="' + Spicetify.Player.data.track.metadata.album_title + '" href="' + album_uri + '" data-uri="' + album_uri + '" data-interaction-target="album-name" class="tl-cell__content">' + Spicetify.Player.data.track.metadata.album_title + "</a>";

        nearArtistSpanText = album_link + " • " + album_date;
    } else if (Spicetify.Player.data.track.uri.includes("spotify:episode")) {
        // podcast
        bgImage = bgImage.replace("spotify:image:", "https://i.scdn.co/image/");
        nearArtistSpanText = Spicetify.Player.data.track.metadata.album_title;
    } else if (Spicetify.Player.data.track.metadata.is_local == "true") {
        // local file
        nearArtistSpanText = Spicetify.Player.data.track.metadata.album_title;
    } else if (Spicetify.Player.data.track.provider == "ad") {
        // ad
        nearArtistSpanText = "advertisement";
        coverListenerInstalled = false;
        return;
    } else {
        // When clicking a song from the homepage, songChange is fired with half empty metadata
        // todo: retry only once?
        setTimeout(songchange, 200);
    }

    if (document.querySelector("#main-trackInfo-year") === null) {
        waitForElement([".main-trackInfo-container"], (queries) => {
            nearArtistSpan = document.createElement("div");
            nearArtistSpan.id = "main-trackInfo-year";
            nearArtistSpan.classList.add("main-trackInfo-artists", "ellipsis-one-line", "main-type-finale");
            nearArtistSpan.innerHTML = nearArtistSpanText;
            queries[0].append(nearArtistSpan);
        });
    } else {
        nearArtistSpan.innerHTML = nearArtistSpanText;
    }
    document.documentElement.style.setProperty("--image_url", 'url("' + bgImage + '")');
}

Spicetify.Player.addEventListener("songchange", songchange);

async function pickCoverColor(img) {
    if (!img.currentSrc.startsWith("spotify:")) return;
    console.log(img);
    console.log(new Vibrant(img, 5));
    var swatches = await new Promise((resolve, reject) => new Vibrant(img, 5).getPalette().then(resolve).catch(reject));
    console.log(swatches);
    var lightCols = ["Vibrant", "DarkVibrant", "Muted", "LightVibrant"];
    var darkCols = ["Vibrant", "LightVibrant", "Muted", "DarkVibrant"];

    var mainCols = isLight(textColorBg) ? lightCols : darkCols;
    textColor = "#509bf5";
    for (var col in mainCols)
        if (swatches[mainCols[col]]) {
            textColor = swatches[mainCols[col]].getHex();
            break;
        }

    sidebarColor = "#509bf5";
    for (var col in lightCols)
        if (swatches[lightCols[col]]) {
            sidebarColor = swatches[lightCols[col]].getHex();
            break;
        }
    updateColors(textColor, sidebarColor);
}

waitForElement([".main-nowPlayingBar-left"], (queries) => {
    var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.removedNodes.length > 0) coverListenerInstalled = false;
        });
    });
    observer.observe(queries[0], { childList: true });
});

function hookCoverChange(pick) {
    waitForElement([".cover-art-image"], (queries) => {
        coverListenerInstalled = true;
        if (pick && queries[0].complete && queries[0].naturalHeight !== 0) pickCoverColor(queries[0]);
        queries[0].addEventListener("load", function () {
            try {
                pickCoverColor(queries[0]);
            } catch (error) {
                console.error(error);
                setTimeout(pickCoverColor, 300, queries[0]);
            }
        });
    });
}

hookCoverChange(false);

(function Startup() {
    if (!Spicetify.showNotification) {
        setTimeout(Startup, 300);
        return;
    }
    // Check latest release
    fetch("https://api.github.com/repos/JulienMaille/dribbblish-dynamic-theme/releases/latest")
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            if (data.tag_name > current) {
                const upd = document.createElement("div");
                upd.innerText = `Theme UPD v${data.tag_name} avail.`;
                upd.classList.add("ellipsis-one-line", "main-type-finale");
                upd.setAttribute("title", `Changes: ${data.name}`);
                upd.style.setProperty("color", "var(--spice-button-active)");
                document.querySelector(".main-userWidget-box").append(upd);
                document.querySelector(".main-userWidget-box").classList.add("update-avail");
                new Spicetify.Menu.Item("Update Dribbblish", false, () => window.open("https://github.com/JulienMaille/dribbblish-dynamic-theme/blob/main/README.md#install--update", "_blank")).register();
            }
        })
        .catch((err) => {
            // Do something for an error here
            console.error(err);
        });
})();

document.documentElement.style.setProperty("--warning_message", " ");
