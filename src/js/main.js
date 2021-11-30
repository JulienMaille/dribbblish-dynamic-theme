import * as Vibrant from "node-vibrant";
import ColorThief from "colorthief";
import chroma from "chroma-js";
import $ from "jquery";
import moment from "moment";

// Break if Dribbblish has already been initialized
if ($("html").attr("dribbblish-js-installed") != undefined) throw new Error("Dribbblish has already been initialized");
// Remove not installed message
$("html").attr("dribbblish-js-installed", "");

import { waitForElement, copyToClipboard, capitalizeFirstLetter, getClosestToNum, randomFromArray, debounce } from "./Util";
import { default as _Dribbblish } from "./Dribbblish";
import "./Folders";

// To expose to external scripts
const Dribbblish = new _Dribbblish();
window.Dribbblish = Dribbblish;

const colorThief = new ColorThief();

Dribbblish.config.register({
    type: "checkbox",
    key: "showLoadingScreen",
    name: "Show Loading Screen",
    description: "Show a loading screen at startup while things are loaded in the background",
    defaultValue: true
});

// In the future maybe have some useful info here
const loadingHints = ["Getting things ready...", "Starting up...", "Just one moment..."];
if (Dribbblish.config.get("showLoadingScreen")) Dribbblish.loader.show(randomFromArray(loadingHints));

Dribbblish.on("ready", () => {
    setTimeout(() => Dribbblish.loader.hide(), 3000);

    Dribbblish.config.register({
        type: "checkbox",
        key: "openSettingsInfo",
        name: "Open Settings Icon",
        description: "Show an icon next to your profile image to open the dribbblish settings",
        defaultValue: true,
        onChange: (val) =>
            Dribbblish.info.set(
                "settings",
                val
                    ? {
                          icon: "settings",
                          color: {
                              fg: "var(--spice-subtext)",
                              bg: "rgba(var(--spice-rgb-subtext), calc(0.1 + var(--is_light) * 0.05))"
                          },
                          order: 999,
                          tooltip: "Open Dribbblish Settings",
                          onClick: () => Dribbblish.config.open()
                      }
                    : null
            )
    });

    Dribbblish.config.register({
        type: "checkbox",
        key: "showSearchBox",
        name: "Show Search Box",
        description: "Show a search box in the top bar. Just like the good old times",
        defaultValue: true,
        onChange: (val) => $("#main").attr("search-box", val ? "" : null),
        onAppended: () => {
            const input = document.createElement("input");
            input.id = "dribbblish-search-box";
            input.type = "search";
            input.placeholder = "Search";
            input.setAttribute("maxlength", "80");
            input.setAttribute("autocorrect", "off");
            input.setAttribute("autocapitalize", "off");
            input.setAttribute("spellcheck", "false");
            input.addEventListener("click", (e) => {
                if (!Spicetify.Platform.History.location.pathname.startsWith("/search")) Spicetify.Platform.History.push(`/search/${input.value}`);
                waitForElement([`[data-testid="search-input"]`], ([defaultSearch]) => {
                    input.focus();
                });
            });
            input.addEventListener(
                "input",
                debounce((e) => {
                    if (Spicetify.Platform.History.location.pathname.startsWith("/search")) {
                        Spicetify.Platform.History.replace(`/search/${input.value}`);
                    } else {
                        Spicetify.Platform.History.push(`/search/${input.value}`);
                    }
                    input.focus();
                }, 250)
            );

            $(".main-topBar-historyButtons").append(input);
        }
    });

    Dribbblish.config.register({
        type: "checkbox",
        key: "rightBigCover",
        name: "Right expanded cover",
        description: "Have the expanded cover Image on the right instead of on the left",
        defaultValue: true,
        onChange: (val) => $("html").toggleClass("right-expanded-cover", val)
    });

    Dribbblish.config.register({
        area: "Sidebar",
        type: "checkbox",
        key: "roundSidebarIcons",
        name: "Round Sidebar Icons",
        description: "If the Sidebar Icons should be round instead of square",
        defaultValue: false,
        onChange: (val) => $("html").css("--sidebar-icons-border-radius", val ? "50vh" : "var(--image-radius)")
    });

    Dribbblish.config.register({
        area: "Animations & Transitions",
        type: "checkbox",
        key: "sidebarHoverAnimation",
        name: "Sidebar Hover Animation",
        description: "If the Sidebar Icons should have an animated background on hover",
        defaultValue: true,
        onChange: (val) => $("html").css("--sidebar-icons-hover-animation", val ? "1" : "0")
    });

    Dribbblish.config.register({
        area: "Sidebar",
        type: "number",
        key: "sidebarGapLeft",
        name: "Left Sidebar Gap Size",
        description: "Set gap size between sidebar icons (in `pixels`).",
        defaultValue: 5,
        data: {
            min: 0
        },
        onChange: (val) => $("html").css("--sidebar-gap-left", `${val}px`)
    });

    Dribbblish.config.register({
        area: "Sidebar",
        type: "number",
        key: "sidebarGapRight",
        name: "Right Sidebar Gap Size",
        description: "Set gap size between sidebar icons (in `pixels`).",
        defaultValue: 32,
        data: {
            min: 0
        },
        onChange: (val) => $("html").css("--sidebar-gap-right", `${val}px`)
    });

    Dribbblish.config.register({
        type: "select",
        data: { none: "None", "none-padding": "None (With Top Padding)", solid: "Solid", transparent: "Transparent" },
        key: "winTopBar",
        name: "Windows Top Bar",
        description: "Have different top Bars (or none at all)",
        defaultValue: "none",
        onChange: (val) => $("#main").attr("top-bar", val)
    });

    waitForElement([".main-nowPlayingBar-container"], ([container]) => {
        Dribbblish.config.register({
            area: "Playbar",
            type: "checkbox",
            key: "playbarShadow",
            name: "Shadow",
            description: "Add a shadow effect underneath the playbar",
            defaultValue: true,
            onChange: (val) => $(container).toggleClass("with-shadow", val)
        });
    });

    Dribbblish.config.register({
        area: "Playbar",
        type: "checkbox",
        key: "playbarTransition",
        name: "Progress Transition",
        description: `
            Have the player progress bar transition smoothly.
            *Turn this off if you're noticing high CPU utilization [(see)](https://github.com/JulienMaille/dribbblish-dynamic-theme/issues/118)*{.muted}
        `,
        defaultValue: true,
        onChange: (val) => $("#main").attr("playbar-transition", val ? "" : null)
    });

    Dribbblish.config.register({
        area: "Playbar",
        type: "select",
        data: { dribbblish: "Dribbblish", spotify: "Spotify" },
        key: "playerControlsStyle",
        name: "Player Controls Style",
        description: "Style of the Player Controls. Selecting Spotify basically changes Play / Pause back to the center",
        defaultValue: "dribbblish",
        onChange: (val) => {
            $("#main").attr("player-controls", val);
            $(".main-trackInfo-container").toggleClass("left", val == "spotify");
        }
    });

    Dribbblish.config.register({
        area: "Playbar",
        type: "checkbox",
        key: "showAlbumInfoInPlaybar",
        name: "Show Album Info in Playbar",
        description: "Show Album Name and Year in the Playbar",
        defaultValue: true,
        onChange: (val) => $("#main").attr("playbar-album-info", val)
    });

    Dribbblish.config.register({
        order: 999,
        type: "checkbox",
        key: "hideAds",
        name: "Hide Ads",
        description: `Hide ads / premium features (see: [SpotifyNoPremium](https://github.com/Daksh777/SpotifyNoPremium))`,
        defaultValue: false,
        onChange: (val) => $("#main").attr("hide-ads", val)
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
            if (value < 121) value = 72;
            $("html").toggleClass("sidebar-hide-text", value < 121);
            $("html").css("--sidebar-width", `${value}px`);
        }
        updateVariable();
    });

    waitForElement([".Root__main-view .os-resize-observer-host"], ([resizeHost]) => {
        const observer = new ResizeObserver(updateVariable);
        observer.observe(resizeHost);
        function updateVariable([event]) {
            $("html").css("--main-view-width", event.contentRect.width + "px");
            $("html").css("--main-view-height", event.contentRect.height + "px");
            $("html").toggleClass("minimal-player", event.contentRect.width < 700);
            $("html").toggleClass("extra-minimal-player", event.contentRect.width < 550);
        }
    });

    waitForElement([".Root", ".playback-bar .progress-bar__slider"], ([root, progKnob]) => {
        const tooltip = document.createElement("div");
        tooltip.className = "prog-tooltip";
        progKnob.append(tooltip);

        function updateProgTime(timeOverride) {
            const newText = Spicetify.Player.formatTime(timeOverride ?? Spicetify.Player.getProgress()) + " / " + Spicetify.Player.formatTime(Spicetify.Player.getDuration());
            // To reduce DOM Updates when the Song is Paused
            if (tooltip.innerText != newText) tooltip.innerText = newText;
        }
        const knobPosObserver = new MutationObserver((muts) => {
            const progressPercentage = Number($(".progress-bar").css("--progress-bar-transform").replace("%", "")) / 100;
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
    });

    /* Config settings */

    Dribbblish.config.register({
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
        onChange: (val) => $("html").css("--song-transition-speed", `${val}s`)
    });

    Dribbblish.config.registerArea({ name: "Advanced", order: 998 });

    Dribbblish.config.register({
        area: "Advanced",
        type: "textarea",
        key: "customCss",
        name: "Custom CSS",
        description: `
            Put custom CSS here. It is recommended that you use some kind of online editor like [CodePen](https://codepen.io/pen/), or even an IDE like [VS Code](https://code.visualstudio.com/) and paste the CSS here.
        `,
        onChange: (val) => {
            let styleElem = document.querySelector("#dribbblish-custom-styles");
            if (!styleElem) {
                styleElem = document.createElement("style");
                styleElem.id = "dribbblish-custom-styles";
                document.body.appendChild(styleElem);
            }
            styleElem.innerHTML = val;
        }
    });

    Dribbblish.config.registerArea({ name: "About", order: 999 });

    Dribbblish.config.register({
        area: "About",
        type: "button",
        key: "aboutDribbblishInfo",
        name: "Info",
        description: `
                OS: \`${capitalizeFirstLetter(Spicetify.Platform.PlatformData.os_name)} v${Spicetify.Platform.PlatformData.os_version}\`
                Spotify: \`v${Spicetify.Platform.PlatformData.event_sender_context_information?.client_version_string ?? Spicetify.Platform.PlatformData.client_version_triple}\`
                Spicetify: \`${Spicetify.version != null ? `v${Spicetify.version}` : "< v2.7.3"}\`
                Dribbblish: \`v${process.env.DRIBBBLISH_VERSION}-${process.env.COMMIT_HASH}\`
            `,
        data: "Copy",
        onChange: function () {
            copyToClipboard(this.description.replace(/\`/g, ""));
            Spicetify.showNotification("Copied!");
        }
    });

    Dribbblish.config.register({
        area: "About",
        type: "button",
        key: "aboutDribbblishBugs",
        name: "Report Bugs",
        description: "Open new issue on GitHub to report a bug",
        data: "Create Report",
        onChange: () => {
            const reportBody = `
                ${process.env.BUG_REPORT}

                <!-- Leave the lines below as they are -->
                ---

                ### Info for Contributors:
                
                **Versions**
                ${Dribbblish.config.getOptions("aboutDribbblishInfo").description}

                **Extensions**
                ${$(`script[src^="extensions/"]`)
                    .toArray()
                    .map((e) => `- ${e.src.split("/").slice(-1)[0]}`)
                    .join("\n")}

                **Settings**
                \`\`\`json
                ${JSON.stringify(Dribbblish.config.export(), null, 4)}
                \`\`\`
            `
                .split("\n")
                .map((line) => line.replace(/^ {16}/, ""))
                .join("\n");

            const reportURL = new URL("https://github.com/JulienMaille/dribbblish-dynamic-theme/issues/new");
            reportURL.searchParams.set("labels", "bug");
            reportURL.searchParams.set("body", reportBody);

            window.open(reportURL.toString(), "_blank");
        }
    });

    Dribbblish.config.register({
        area: "About",
        type: "button",
        key: "aboutDribbblishFeature",
        name: "Request Feature",
        description: "Open new issue on GitHub to request a feature",
        data: "Request Feature",
        onChange: () => {
            const reportURL = new URL("https://github.com/JulienMaille/dribbblish-dynamic-theme/issues/new");
            reportURL.searchParams.set("labels", "enhancement");
            reportURL.searchParams.set("template", "feature_request.md");

            window.open(reportURL.toString(), "_blank");
        }
    });

    Dribbblish.config.register({
        area: "About",
        type: "button",
        key: "aboutDribbblishChangelog",
        name: "Changelog",
        description: "Open GitHub releases page",
        data: "Open",
        onChange: () => window.open("https://github.com/JulienMaille/dribbblish-dynamic-theme/releases", "_blank")
    });

    /* js */
    async function getAlbumRelease(uri) {
        const info = await Spicetify.CosmosAsync.get(`hm://album/v1/album-app/album/${uri}/desktop`);
        return { year: info.year, month: (info.month ?? 1) - 1, day: info.day ?? 1 };
    }

    function isLight(hex) {
        return chroma(hex).luminance() > 0.5;
    }

    // From: https://stackoverflow.com/a/13763063/12126879
    function getImageLightness(img) {
        var colorSum = 0;
        var canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var data = imageData.data;
        var r, g, b, avg;

        for (var x = 0, len = data.length; x < len; x += 4) {
            r = data[x];
            g = data[x + 1];
            b = data[x + 2];

            avg = Math.floor((r + g + b) / 3);
            colorSum += avg;
        }

        var brightness = Math.floor(colorSum / (img.width * img.height));
        return brightness;
    }

    // parse to hex because "--spice-sidebar" is `rgb()`
    let textColorBg = chroma($("html").css("--spice-main")).hex();

    function setRootColor(name, color) {
        $("html").css(`--spice-${name}`, chroma(color).hex());
        $("html").css(`--spice-rgb-${name}`, chroma(color).rgb().join(","));
    }

    function toggleDark(setDark) {
        if (setDark === undefined) setDark = isLight(textColorBg);
        $("html").css("--is_light", setDark ? 0 : 1);

        switch (Dribbblish.config.get("bgTheme")) {
            case "bw":
                textColorBg = setDark ? "#0A0A0A" : "#FAFAFA";
                break;
            case "nord":
                textColorBg = setDark ? "#3B4252" : "#D8DEE9";
                break;
            case "grey":
                textColorBg = setDark ? "#202020" : "#C0C0C0";
                break;
        }

        setRootColor("main", textColorBg);
        setRootColor("player", textColorBg);
        setRootColor("card", setDark ? "#040404" : "#ECECEC");
        setRootColor("subtext", setDark ? "#EAEAEA" : "#3D3D3D");
        setRootColor("notification", setDark ? "#303030" : "#DDDDDD");

        updateColors(false);
    }

    function checkDarkLightMode() {
        const theme = Dribbblish.config.get("theme");
        if (theme == "time") {
            const start = 60 * parseInt(Dribbblish.config.get("darkModeOnTime").split(":")[0]) + parseInt(Dribbblish.config.get("darkModeOnTime").split(":")[1]);
            const end = 60 * parseInt(Dribbblish.config.get("darkModeOffTime").split(":")[0]) + parseInt(Dribbblish.config.get("darkModeOffTime").split(":")[1]);

            const now = new Date();
            const time = 60 * now.getHours() + now.getMinutes();

            let dark;
            if (end < start) dark = start <= time || time < end;
            else dark = start <= time && time < end;
            toggleDark(dark);
        }
    }

    // Run every Minute to check time and set dark / light mode
    setInterval(checkDarkLightMode, 60000);

    Dribbblish.config.register({
        area: "Theme",
        type: "select",
        key: "colorSelectionAlgorithm",
        name: "Color Selection Algorithm",
        description: `
            Algorithm of selecting colors from the albumart
            - **Colorthief [(see)](https://lokeshdhakar.com/projects/color-thief/):** Gets more fitting colors
            - **Vibrant [(see)](https://jariz.github.io/vibrant.js/):** Gets more vibrant colors *(was the default up to v3.1.1)*
            - **Spotify:** Basically Vibrant but internal
            - **Static:** Select a static color to be used
            {.muted}
        `,
        data: { spotify: "Spotify", colorthief: "Colorthief", vibrant: "Vibrant", static: "Static" },
        defaultValue: "colorthief",
        onChange: () => updateColors(),
        showChildren: (val) => {
            if (val == "static") return ["colorOverride"];
            return ["colorSelectionMode"];
        },
        children: [
            {
                type: "color",
                key: "colorOverride",
                name: "Color",
                description: "The Color of the Theme",
                defaultValue: "#1ed760",
                fireInitialChange: false,
                onChange: () => updateColors()
            },
            {
                area: "Theme",
                type: "select",
                key: "colorSelectionMode",
                name: "Color Selection Mode",
                description: `
                    Method of selecting colors from the albumart
                    - **Default:** Choose closest matching
                    - **Luminance:** Choose matching current theme (lighter/darker)
                    {.muted}
                `,
                data: { default: "Default", luminance: "Luminance" },
                defaultValue: "default",
                onChange: () => updateColors(),
                showChildren: (val) => {
                    if (val == "dynamicLuminance") return ["lightModeLuminance", "darkModeLuminance"];
                    return false;
                },
                children: [
                    {
                        type: "number",
                        key: "lightModeLuminance",
                        name: "Desired Light Mode Luminance",
                        description: `
                            Set desired luminance in light mode.
                            *the selected color will be the one who's luminance is closest to the desired luminance*{.muted}
                        `,
                        defaultValue: 0.6,
                        data: { min: 0, max: 1, step: 0.05 },
                        fireInitialChange: false,
                        onChange: () => updateColors()
                    },
                    {
                        type: "number",
                        key: "darkModeLuminance",
                        name: "Desired Dark Mode Luminance",
                        description: `
                            Set desired luminance in dark mode.
                            *the selected color will be the one who's luminance is closest to the desired luminance*{.muted}
                        `,
                        defaultValue: 0.2,
                        data: { min: 0, max: 1, step: 0.05 },
                        fireInitialChange: false,
                        onChange: () => updateColors()
                    }
                ]
            }
        ]
    });

    Dribbblish.config.register({
        area: "Theme",
        type: "select",
        data: { dark: "Dark", light: "Light", time: "Based on Time" },
        order: -1,
        key: "theme",
        name: "Theme",
        description: "Select Dark / Bright mode",
        defaultValue: "time",
        showChildren: (val) => {
            if (val == "time") return ["darkModeOnTime", "darkModeOffTime", "bgTheme"];
            return ["bgTheme"];
        },
        onChange: (val) => {
            switch (val) {
                case "dark":
                    toggleDark(true);
                    break;
                case "light":
                    toggleDark(false);
                    break;
                case "time":
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
            },
            {
                area: "Theme",
                type: "select",
                data: { bw: "Black / White", nord: "Nord", grey: "Greyish" },
                key: "bgTheme",
                name: "Background Theme",
                description: "Select which colors should be used as main background colors",
                defaultValue: "bw",
                onChange: () => toggleDark($("html").css("--is_light") == "0")
            }
        ]
    });

    function updateColors(checkDarkMode = true, sideColHex) {
        if (sideColHex == undefined) return registerCoverListener();

        let isLightBg = isLight(textColorBg);
        let textColHex = sideColHex;
        if (isLightBg && chroma(textColHex).luminance() > 0.2) {
            textColHex = chroma(textColHex).luminance(0.2).hex();
        } else if (!isLightBg && chroma(textColHex).luminance() < 0.1) {
            textColHex = chroma(textColHex).luminance(0.1).hex();
        }

        let darkColHex = chroma(textColHex)
            .brighten(isLightBg ? 0.12 : -0.2)
            .hex();
        let darkerColHex = chroma(textColHex)
            .brighten(isLightBg ? 0.3 : -0.4)
            .hex();
        let buttonBgColHex = chroma(textColHex)
            .set("hsl.l", isLightBg ? 0.9 : 0.14)
            .hex();
        setRootColor("text", textColHex);
        setRootColor("button", darkerColHex);
        setRootColor("button-active", darkColHex);
        setRootColor("selected-row", darkerColHex);
        setRootColor("tab-active", buttonBgColHex);
        setRootColor("button-disabled", buttonBgColHex);
        setRootColor("sidebar", sideColHex);
        setRootColor("sidebar-text", isLight(sideColHex) ? "#000000" : "#FFFFFF");

        if (checkDarkMode) checkDarkLightMode([textColHex, sideColHex]);
    }

    async function songchange() {
        if (!document.querySelector(".main-trackInfo-container")) return setTimeout(songchange, 300);

        try {
            // warning popup
            if (Spicetify.Platform.PlatformData.client_version_triple < "1.1.68") Spicetify.showNotification(`Your version of Spotify ${Spicetify.Platform.PlatformData.client_version_triple}) is un-supported`);
        } catch (err) {
            console.error(err);
        }

        if (!document.getElementById("main-trackInfo-year")) {
            const el = document.createElement("div");
            el.classList.add("main-trackInfo-release", "standalone-ellipsis-one-line", "main-type-finale");
            el.setAttribute("as", "div");
            el.id = "main-trackInfo-year";
            document.querySelector(".main-trackInfo-container").append(el);
        }
        const albumInfoSpan = document.getElementById("main-trackInfo-year");

        let album_uri = Spicetify.Player.data.track.metadata.album_uri;
        let bgImage = Spicetify.Player.data.track.metadata.image_url;
        if (bgImage === undefined) {
            bgImage = "/images/tracklist-row-song-fallback.svg";
        }

        if (album_uri !== undefined && !album_uri.includes("spotify:show")) {
            moment.locale(Spicetify.Locale.getLocale());
            const albumDate = moment(await getAlbumRelease(album_uri.replace("spotify:album:", "")));
            const albumLinkElem = `
                <span>
                    <span draggable="true">
                        <a draggable="false" dir="auto" href="${album_uri}">${Spicetify.Player.data.track.metadata.album_title}</a>
                    </span>
                </span>
            `;
            const albumDateElem = `<span> • <span title="${albumDate.format("L")}">${albumDate.format(moment().diff(albumDate, "months") <= 6 ? "MMM YYYY" : "YYYY")}</span></span>`;
            albumInfoSpan.innerHTML = `${albumLinkElem}${albumDateElem}`;
        } else if (Spicetify.Player.data.track.uri.includes("spotify:episode")) {
            // podcast
            bgImage = bgImage.replace("spotify:image:", "https://i.scdn.co/image/");
            albumInfoSpan.innerHTML = Spicetify.Player.data.track.metadata.album_title;
        } else if (Spicetify.Player.data.track.metadata.is_local == "true") {
            // local file
            albumInfoSpan.innerHTML = Spicetify.Player.data.track.metadata.album_title;
        } else if (Spicetify.Player.data.track.provider == "ad") {
            // ad
            albumInfoSpan.innerHTML = "Advertisement";
            return;
        } else {
            // When clicking a song from the homepage, songChange is fired with half empty metadata
            // todo: retry only once?
            setTimeout(songchange, 200);
        }

        $("html").css("--image-url", `url("${bgImage}")`);
        registerCoverListener();
    }

    Spicetify.Player.addEventListener("songchange", songchange);
    songchange();

    async function pickCoverColor(img) {
        if (!img.currentSrc.startsWith("spotify:")) return;

        $("html").css("--image-brightness", getImageLightness(img) / 255);

        let color = "#509bf5";
        if (img.complete) {
            const colorSelectionAlgorithm = Dribbblish.config.get("colorSelectionAlgorithm");
            const colorSelectionMode = Dribbblish.config.get("colorSelectionMode");
            let palette = {};

            if (colorSelectionAlgorithm == "spotify") {
                const swatches = await Spicetify.colorExtractor(Spicetify.Player.data.track.uri);
                for (const col of ["VIBRANT", "VIBRANT_NON_ALARMING", "PROMINENT", "DARK_VIBRANT", "LIGHT_VIBRANT", "DESATURATED"]) {
                    const c = chroma(swatches[col]);
                    palette[c.luminance()] = c;
                }
            } else if (colorSelectionAlgorithm == "colorthief") {
                palette = Object.fromEntries([colorThief.getColor(img), ...colorThief.getPalette(img, 24, 5)].map((c) => chroma(c)).map((c) => [c.luminance(), c]));
            } else if (colorSelectionAlgorithm == "vibrant") {
                const swatches = await new Promise((resolve, reject) => new Vibrant(img, 5).getPalette().then(resolve).catch(reject));
                for (const col of ["Vibrant", "DarkVibrant", "Muted", "LightVibrant"]) {
                    if (swatches[col]) {
                        const c = chroma(swatches[col].getHex());
                        palette[c.luminance()] = c;
                    }
                }
            } else if (colorSelectionAlgorithm == "static") {
                palette[1] = chroma(Dribbblish.config.get("colorOverride"));
            }

            if (colorSelectionMode == "default") {
                color = Object.values(palette)[0];
                for (const col of Object.values(palette)) {
                    if (col.luminance() > 0.05 && col.luminance() < 0.9) {
                        color = col.hex();
                        break;
                    }
                }
            } else if (colorSelectionMode == "luminance") {
                const wantedLuminance = $("html").css("--is_light") == "1" ? Dribbblish.config.get("lightModeLuminance") : Dribbblish.config.get("darkModeLuminance");
                color = palette[getClosestToNum(Object.keys(palette), wantedLuminance)].hex();
            }
        }

        updateColors(false, color);
    }

    var coverListener;
    function registerCoverListener() {
        const img = document.querySelector(".main-image-image.cover-art-image");
        if (!img) return setTimeout(registerCoverListener, 250); // Check if image exists
        if (!img.complete) return img.addEventListener("load", registerCoverListener); // Check if image is loaded
        pickCoverColor(img);

        if (coverListener != null) {
            coverListener.disconnect();
            coverListener = null;
        }

        coverListener = new MutationObserver((muts) => {
            const img = document.querySelector(".main-image-image.cover-art-image");
            if (!img) return registerCoverListener();
            pickCoverColor(img);
        });
        coverListener.observe(img, {
            attributes: true,
            attributeFilter: ["src"]
        });
    }
    registerCoverListener();

    // Check latest release every 10m
    function checkForUpdate() {
        fetch("https://api.github.com/repos/JulienMaille/dribbblish-dynamic-theme/releases/latest")
            .then((response) => response.json())
            .then((data) => {
                Dribbblish.info.set("dribbblish-update", data.tag_name > process.env.DRIBBBLISH_VERSION ? { text: `v${data.tag_name}`, tooltip: "Nev Dribbblish version available", icon: "palette", onClick: () => window.open("https://github.com/JulienMaille/dribbblish-dynamic-theme/releases/latest", "_blank") } : null);
            })
            .catch(console.error);

        fetch("https://api.github.com/repos/khanhas/spicetify-cli/releases/latest")
            .then((response) => response.json())
            .then((data) => {
                Dribbblish.info.set("spicetify-update", data.tag_name.substring(1) > (Spicetify.version ?? "2.7.2") ? { text: data.tag_name, tooltip: "New Spicetify version available", icon: "spicetify", onClick: () => window.open("https://github.com/khanhas/spicetify-cli/releases/latest", "_blank") } : null);
            })
            .catch(console.error);
    }

    setInterval(checkForUpdate, 10 * 60 * 1000);
    checkForUpdate();

    function registerCastingListener() {
        if (!document.querySelector(".main-nowPlayingBar-container")) return setTimeout(registerCastingListener, 250);

        function setInfo() {
            if (!document.querySelector(".main-connectBar-connectBar svg > path")) return;
            Dribbblish.info.set("casting", {
                icon: $(".main-connectBar-connectBar svg > path").attr("d").includes("1.48 1.48") ? "cast-connected" : "cast",
                text: $(".main-connectBar-connectBar").text(),
                // TODO: make onClick act like clicking on the connect to device button
                // onClick: () => ,
                order: -999
            });
        }
        setInfo();

        const castingListener = new MutationObserver((muts) => {
            let action;
            for (const mut of muts) {
                if (mut.target instanceof HTMLElement && (mut.target.classList.contains("main-connectBar-connectBar") || mut.target.querySelector(".main-connectBar-connectBar"))) action = "change";
                for (const el of mut.addedNodes) if (el instanceof HTMLElement && el.querySelector(".main-connectBar-connectBar")) action = "add";
                for (const el of mut.removedNodes) if (el instanceof HTMLElement && el.querySelector(".main-connectBar-connectBar")) action = "remove";
            }
            if (["add", "change"].includes(action)) {
                setInfo();
            } else if (action == "remove") {
                Dribbblish.info.remove("casting");
            }
        });
        castingListener.observe(document.querySelector(".main-nowPlayingBar-container"), {
            childList: true,
            subtree: true
        });
    }
    registerCastingListener();

    // Show "Offline" info
    function offlineInfo(show) {
        Dribbblish.info.set(
            "offline",
            show
                ? {
                      tooltip: "Offline",
                      icon: "cloud-off",
                      order: 998,
                      color: {
                          fg: "#ffffff",
                          bg: "#ff2323"
                      }
                  }
                : null
        );
    }
    window.addEventListener("offline", () => offlineInfo(true));
    window.addEventListener("online", () => offlineInfo(false));
    offlineInfo(!navigator.onLine);

    // Show "Dev / Beta" info
    switch (process.env.DRIBBBLISH_VERSION) {
        case "Dev":
            Dribbblish.info.set("dev", { tooltip: "Dev build", icon: "code", order: 997 });
            break;
        case "Beta":
            Dribbblish.info.set("beta", { tooltip: "Beta build", icon: "info", order: 997 });
            break;
        default:
            break;
    }
});
