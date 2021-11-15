import * as Vibrant from "node-vibrant";
import chroma from "chroma-js";
import $ from "jquery";
import moment from "moment";

import { waitForElement, copyToClipboard, capitalizeFirstLetter } from "./Util";
import ConfigMenu from "./ConfigMenu";
import Info from "./Info";

import svgArrowDown from "svg/arrow-down";
import svgCode from "svg/code";
import svgWifiSlash from "svg/wifi-slash";
import svgCog from "svg/cog";

const Dribbblish = {
    config: new ConfigMenu(),
    info: new Info()
};
// To expose to external scripts
window.Dribbblish = Dribbblish;

Dribbblish.config.register({
    type: "checkbox",
    key: "openSettingsInfo",
    name: "Open Settings Icon",
    description: "Show an icon next to your profile image to open the dribbblish settings",
    defaultValue: true,
    onChange: (val) =>
        Dribbblish.info[val ? "set" : "remove"]("settings", {
            icon: svgCog,
            color: {
                fg: "var(--spice-subtext)",
                bg: "rgba(var(--spice-rgb-subtext), calc(0.1 + var(--is_light) * 0.05))"
            },
            order: 999,
            tooltip: "Open Dribbblish Settings",
            onClick: () => Dribbblish.config.open()
        })
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

waitForElement([".main-nowPlayingBar-container"], ([container]) => {
    Dribbblish.config.register({
        area: "Playbar",
        type: "checkbox",
        key: "playbarShadow",
        name: "Playbar Shadow",
        description: "Add a shadow effect underneath the playbar",
        defaultValue: true,
        onChange: (val) => $(container).toggleClass("with-shadow", val)
    });
});

waitForElement(["#main"], () => {
    Dribbblish.config.register({
        type: "select",
        data: { none: "None", "none-padding": "None (With Top Padding)", solid: "Solid", transparent: "Transparent" },
        key: "winTopBar",
        name: "Windows Top Bar",
        description: "Have different top Bars (or none at all)",
        defaultValue: "none",
        onChange: (val) => $("#main").attr("top-bar", val)
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
        area: "Ads",
        type: "checkbox",
        key: "hideAds",
        name: "Hide Ads",
        description: `Hide ads / premium features (see: [SpotifyNoPremium](https://github.com/Daksh777/SpotifyNoPremium))`,
        defaultValue: false,
        onChange: (val) => $("#main").attr("hide-ads", val)
    });
});

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
            loadPlaylistImage();
        };
        reader.readAsDataURL(file);
    };

    new Spicetify.ContextMenu.Item(
        "Remove folder image",
        ([uri]) => {
            const id = Spicetify.URI.from(uri).id;
            localStorage.removeItem("dribbblish:folder-image:" + id);
            loadPlaylistImage();
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

// waitForElement because Spicetify is not initialized at startup
waitForElement(["#main"], () => {
    Dribbblish.config.registerArea({ name: "About", order: 999 });

    Dribbblish.config.register({
        area: "About",
        type: "button",
        key: "aboutDribbblishInfo",
        name: "Info",
        description: `
            OS: \`${capitalizeFirstLetter(Spicetify.Platform.PlatformData.os_name)} v${Spicetify.Platform.PlatformData.os_version}\`
            Spotify: \`v${Spicetify.Platform.PlatformData.event_sender_context_information?.client_version_string ?? Spicetify.Platform.PlatformData.client_version_triple}\`
            Spicetify: \`${Spicetify.version != null ? `v${Spicetify.version}` : "<= v2.7.2"}\`
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
        description: "Open new issue on GitHub",
        data: "Create Report",
        onChange: () => {
            const reportBody = `
                **Describe the bug**
                A clear and concise description of what the bug is.
                
                **To Reproduce**
                Steps to reproduce the behavior:
                
                **Screenshots**
                If applicable, add screenshots to help explain your problem.

                **Logs**
                Add logs from console. To do that
                1. Run \`spicetify enable-devtool\` in terminal
                2. Spotify will be restarted
                3. Hit <kbd>Ctrl + Shift + I</kbd> to open DevTools window
                4. Navigate to tab Console
                5. Copy console window content.

                \`\`\`console
                (Please paste here console logs or attach a screenshot)
                \`\`\`

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
        key: "aboutDribbblishChangelog",
        name: "Changelog",
        description: "Open GitHub releases page",
        data: "Open",
        onChange: () => window.open("https://github.com/JulienMaille/dribbblish-dynamic-theme/releases", "_blank")
    });
});

/* js */
async function getAlbumRelease(uri) {
    const info = await Spicetify.CosmosAsync.get(`hm://album/v1/album-app/album/${uri}/desktop`);
    return { year: info.year, month: (info.month ?? 1) - 1, day: info.day ?? 1 };
}

function isLight(hex) {
    var [r, g, b] = chroma(hex).rgb().map(Number);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
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

// parse to hex beacuse "--spice-sidebar" is `rgb()`
let textColor = chroma($("html").css("--spice-text")).hex();
let textColorBg = chroma($("html").css("--spice-main")).hex();
let sidebarColor = chroma($("html").css("--spice-sidebar")).hex();

function setRootColor(name, color) {
    $("html").css(`--spice-${name}`, chroma(color).hex());
    $("html").css(`--spice-rgb-${name}`, chroma(color).rgb().join(","));
}

function toggleDark(setDark) {
    if (setDark === undefined) setDark = isLight(textColorBg);

    $("html").css("--is_light", setDark ? 0 : 1);
    textColorBg = setDark ? "#0A0A0A" : "#FAFAFA";

    setRootColor("main", textColorBg);
    setRootColor("player", textColorBg);
    setRootColor("card", setDark ? "#040404" : "#ECECEC");
    setRootColor("subtext", setDark ? "#EAEAEA" : "#3D3D3D");
    setRootColor("notification", setDark ? "#303030" : "#DDDDDD");

    updateColors(textColor, sidebarColor, false);
}

function checkDarkLightMode(colors) {
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
    } else if (theme == "color") {
        if (colors && colors.length > 0) toggleDark(isLight(colors[0]));
    }
}
// Run every Minute to check time and set dark / light mode
setInterval(checkDarkLightMode, 60000);

Dribbblish.config.register({
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

Dribbblish.config.register({
    area: "Theme",
    type: "select",
    data: { dark: "Dark", light: "Light", time: "Based on Time", color: "Based on Color" },
    key: "theme",
    name: "Theme",
    description: "Select Dark / Bright mode",
    defaultValue: "dark",
    showChildren: (val) => {
        if (val == "time") return ["darkModeOnTime", "darkModeOffTime"];
        return false;
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
            case "color":
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

    if (!Dribbblish.config.get("dynamicColors")) {
        const col = Dribbblish.config.get("colorOverride");
        textColHex = col;
        sideColHex = col;
    }

    let isLightBg = isLight(textColorBg);
    if (isLightBg) textColHex = chroma(textColHex).darken(0.15).hex(); // vibrant color is always too bright for white bg mode

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
        textColor = "#509bf5";
        updateColors(textColor, textColor);
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

async function pickCoverColor(img) {
    if (!img.currentSrc.startsWith("spotify:")) return;

    $("html").css("--image-brightness", getImageLightness(img) / 255);

    var swatches = await new Promise((resolve, reject) => new Vibrant(img, 5).getPalette().then(resolve).catch(reject));
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
waitForElement([".main-topBar-container"], ([topBarContainer]) => {
    function checkForUpdate() {
        fetch("https://api.github.com/repos/JulienMaille/dribbblish-dynamic-theme/releases/latest")
            .then((response) => response.json())
            .then((data) => {
                const isDev = process.env.DRIBBBLISH_VERSION == "Dev";
                Dribbblish.info.set("update", isDev || data.tag_name > process.env.DRIBBBLISH_VERSION ? { text: `v${data.tag_name}`, tooltip: "Open Release page to download", icon: svgArrowDown, onClick: () => window.open("https://github.com/JulienMaille/dribbblish-dynamic-theme/releases/latest", "_blank") } : null);
                Dribbblish.info.set("dev", isDev ? { tooltip: "Dev build", icon: svgCode } : null);
            })
            .catch(console.error);
    }

    setInterval(checkForUpdate(), 10 * 60 * 1000);
    checkForUpdate();
});

// Show "Offline info"
window.addEventListener("offline", () =>
    Dribbblish.info.set("offline", {
        tooltip: "Offline",
        icon: svgWifiSlash,
        order: 998,
        color: {
            fg: "#ffffff",
            bg: "#ff2323"
        }
    })
);
window.addEventListener("online", () => Dribbblish.info.remove("offline"));

$("html").css("--warning_message", " ");
