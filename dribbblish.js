// Hide popover message
// document.getElementById("popover-container").style.height = 0;
class ConfigMenu {
    /**
     * @typedef {Object} DribbblishConfigOptions
     * @property {"checkbox" | "select" | "button" | "slider" | "number" | "text" | "time"} type
     * @property {String} [area="Main Settings"]
     * @property {any} [data={}]
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
     * @property {DribbblishConfigOptions[]} [children=[]]
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

    /** @type {Object.<string, DribbblishConfigOptions>} */
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
     * @param {DribbblishConfigOptions} options
     */
    addInputHTML(options) {
        if (!document.querySelector(`.dribbblish-config-area[name="${options.area}"]`)) {
            const areaElem = document.createElement("div");
            areaElem.classList.add("dribbblish-config-area");
            areaElem.setAttribute("name", options.area);
            areaElem.innerHTML = `<h2>${options.area}</h2>`;
            document.querySelector(".dribbblish-config-areas").appendChild(areaElem);
        }
        const parent = document.querySelector(`.dribbblish-config-area[name="${options.area}"]`);

        const elem = document.createElement("div");
        elem.classList.add("dribbblish-config-item");
        elem.setAttribute("key", options.key);
        elem.setAttribute("type", options.type);
        elem.setAttribute("hidden", options.hidden);
        if (options.childOf) elem.setAttribute("parent", options.childOf);
        elem.innerHTML = /* html */ `
            <h2 class="x-settings-title main-type-cello${!options.description ? " no-desc" : ""}" as="h2">${options.name}</h2>
            <label class="main-type-mesto" as="label" for="dribbblish-config-input-${options.key}">${options.description}</label>
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
     * @param {DribbblishConfigOptions} options
     */
    register(options) {
        const defaultOptions = {
            hidden: false,
            area: "Main Settings",
            data: {},
            name: "",
            description: "",
            insertOnTop: false,
            fireInitialChange: true,
            showChildren: () => true,
            onAppended: () => {},
            onChange: () => {},
            children: []
        };
        // Set Defaults
        options = { ...defaultOptions, ...options };
        options._onChange = options.onChange;
        options.onChange = (val) => {
            options._onChange(val);
            const show = options.showChildren(val);
            options.children.forEach((child) => this.setHidden(child.key, Array.isArray(show) ? !show.includes(child.key) : !show));
        };
        options.children = options.children.map((child) => {
            return { ...defaultOptions, ...child, area: options.area, childOf: options.key };
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

            const input = /* html */ `
                <button class="main-buttons-button main-button-primary" type="button" id="dribbblish-config-input-${options.key}">
                    <div class="x-settings-buttonContainer">
                        <span>${options.name}</span>
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
        } else {
            throw new Error(`Config Type "${options.type}" invalid`);
        }

        options.children.forEach((child) => this.register(child));

        options.onAppended();
        if (options.fireInitialChange) options.onChange(this.get(options.key));
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
            body[hide-ads] .main-topBar-UpgradeButton {
                display: none
            }
        `);
        document.styleSheets[0].insertRule(/* css */ `
            /* Remove upgrade to premium button in user menu */
            body[hide-ads] .main-contextMenu-menuItemButton[href="https://www.spotify.com/premium/"] {
                display: none
            }
        `);
        document.styleSheets[0].insertRule(/* css */ `
            /* Remove ad placeholder in main screen */
            body[hide-ads] .main-leaderboardComponent-container {
                display: none
            }
        `);
    },
    onChange: (val) => document.body.setAttribute("hide-ads", val ? "" : null)
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

waitForElement([
    ".Root__nav-bar .LayoutResizer__input, .Root__nav-bar .LayoutResizer__resize-bar input"
], ([resizer]) => {
    const observer = new MutationObserver(updateVariable);
    observer.observe(resizer, { attributes: true, attributeFilter: ["value"]});
    function updateVariable() {
        let value = resizer.value;
        if (value < 121) {
            value = 72;
            document.documentElement.classList.add("sidebar-hide-text");
        } else {
            document.documentElement.classList.remove("sidebar-hide-text");
        }
        document.documentElement.style.setProperty(
            "--sidebar-width", value + "px");
    }
    updateVariable();
});

waitForElement([".Root__main-view .os-resize-observer-host"], ([resizeHost]) => {
    const observer = new ResizeObserver(updateVariable);
    observer.observe(resizeHost);
    function updateVariable([ event ]) {
        document.documentElement.style.setProperty(
            "--main-view-width", event.contentRect.width + "px");
        document.documentElement.style.setProperty(
            "--main-view-height", event.contentRect.height + "px");
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
        const isExternal = state.devices.some(a => a.is_active);
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
    filePickerInput.accept = [
        "image/jpeg",
        "image/apng",
        "image/avif",
        "image/gif",
        "image/png",
        "image/svg+xml",
        "image/webp"
    ].join(",");

    filePickerInput.onchange = () => {
        if (!filePickerInput.files.length) return;

        const file = filePickerInput.files[0];
        const reader = new FileReader;
        reader.onload = (event) => {
            const result = event.target.result;
            const id = Spicetify.URI.from(filePickerInput.uri).id;
            try {
                localStorage.setItem(
                    "dribbblish:folder-image:" + id,
                    result
                );
            } catch {
                Spicetify.showNotification("File too large");
            }
            DribbblishShared.loadPlaylistImage?.call();
        }
        reader.readAsDataURL(file);
    }

    new Spicetify.ContextMenu.Item("Remove folder image",
        ([uri]) => {
            const id = Spicetify.URI.from(uri).id;
            localStorage.removeItem("dribbblish:folder-image:" + id);
            DribbblishShared.loadPlaylistImage?.call();
        },
        ([uri]) => Spicetify.URI.isFolder(uri),
        "x",
    ).register();
    new Spicetify.ContextMenu.Item("Choose folder image",
        ([uri]) => {
            filePickerInput.uri = uri;
            filePickerForm.reset();
            filePickerInput.click();
        },
        ([uri]) => Spicetify.URI.isFolder(uri),
        "edit",
    ).register();
})();
