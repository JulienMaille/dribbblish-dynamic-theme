let current = "1.0";

function waitForElement(els, func, timeout = 100) {
    const queries = els.map(el => document.querySelector(el));
    if (queries.every(a => a)) {
        func(queries);
    } else if (timeout > 0) {
        setTimeout(waitForElement, 300, els, func, --timeout);
    }
}

let DribbblishShared = {};

// back shadow
waitForElement([".Root__top-container"], ([topContainer]) => {
    const shadow = document.createElement("div");
    shadow.id = "dribbblish-back-shadow";
    topContainer.prepend(shadow);
});

// Spicetify.Platform.ConnectAPI.state.connectionStatus;

// add fade effect on playlist/folder list
waitForElement([".main-navBar-mainNav .os-viewport.os-viewport-native-scrollbars-invisible"], ([scrollNode]) => {
    scrollNode.setAttribute("fade", "bottom");
    scrollNode.addEventListener("scroll", () => {
        if (scrollNode.scrollTop == 0) {
            scrollNode.setAttribute("fade", "bottom");
        } else if (scrollNode.scrollHeight - scrollNode.clientHeight - scrollNode.scrollTop == 0) {
            scrollNode.setAttribute("fade", "top");
        } else {
            scrollNode.setAttribute("fade", "full");
        }
    });
});

let version;
let ylx;

(function Dribbblish() {
    // dynamic playback time tooltip
    const progBar = document.querySelector(".playback-bar");
    const root = document.querySelector(".Root");

    if (!Spicetify.Player.origin || !progBar || !root) {
        setTimeout(Dribbblish, 300);
        return;
    }

    version = Spicetify.Platform.PlatformData.event_sender_context_information.client_version_int;

    if (version < 121200000) {
        document.documentElement.classList.add("legacy");
        legacy();
    } else if (version >= 121200000 && version < 121400000) {
        document.documentElement.classList.add("legacy-gridChange");
        legacy();
    } else if (version >= 121400000) {
        document.documentElement.classList.add("ylx");
        ylx = true;
    }

    const tooltip = document.createElement("div");
    tooltip.className = "prog-tooltip";
    progBar.append(tooltip);

    function updateProgTime({ data: e }) {
        const maxWidth = progBar.offsetWidth;
        const curWidth = Spicetify.Player.getProgressPercent() * maxWidth;
        const ttWidth = tooltip.offsetWidth / 2;
        if (curWidth < ttWidth + 12) {
            tooltip.style.left = "12px";
        } else if (curWidth > maxWidth - ttWidth - 12) {
            tooltip.style.left = String(maxWidth - ttWidth * 2 - 12) + "px";
        } else {
            tooltip.style.left = String(curWidth - ttWidth) + "px";
        }
        tooltip.innerText = Spicetify.Player.formatTime(e) + " / " + Spicetify.Player.formatTime(Spicetify.Player.getDuration());
    }
    Spicetify.Player.addEventListener("onprogress", updateProgTime);
    updateProgTime({ data: Spicetify.Player.getProgress() });

    // filepicker for custom folder images
    const filePickerForm = document.createElement("form");
    filePickerForm.setAttribute("aria-hidden", true);
    filePickerForm.innerHTML = '<input type="file" class="hidden-visually" />';
    /** @type {HTMLInputElement} */
    const filePickerInput = filePickerForm.childNodes[0];
    filePickerInput.accept = ["image/jpeg", "image/apng", "image/avif", "image/gif", "image/png", "image/svg+xml", "image/webp"].join(",");

    filePickerInput.onchange = () => {
        if (!filePickerInput.files.length) return;

        const file = filePickerInput.files[0];
        const reader = new FileReader();
        reader.onload = event => {
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

    // context menu items for custom folder images
    new Spicetify.ContextMenu.Item(
        "Remove folder image",
        ([uri]) => {
            const id = Spicetify.URI.from(uri).id;
            localStorage.removeItem("dribbblish:folder-image:" + id);
            DribbblishShared.loadPlaylistImage?.call();
        },
        ([uri]) => Spicetify.URI.isFolder(uri) && !ylx,
        "x"
    ).register();
    new Spicetify.ContextMenu.Item(
        "Choose folder image",
        ([uri]) => {
            filePickerInput.uri = uri;
            filePickerForm.reset();
            filePickerInput.click();
        },
        ([uri]) => Spicetify.URI.isFolder(uri) && !ylx,
        "edit"
    ).register();
})();

// LEGACY NAVBAR ONLY
function legacy() {
    if (!Spicetify.Platform) {
        setTimeout(legacy, 300);
        return;
    }

    // allow resizing of the navbar
    waitForElement([".Root__nav-bar .LayoutResizer__input"], ([resizer]) => {
        const observer = new MutationObserver(updateVariable);
        observer.observe(resizer, { attributes: true, attributeFilter: ["value"] });
        function updateVariable() {
            let value = resizer.value;
            if (value < 121) {
                value = 72;
                document.documentElement.classList.add("left-sidebar-collapsed");
            } else {
                document.documentElement.classList.remove("left-sidebar-collapsed");
            }
            document.documentElement.style.setProperty("--nav-bar-width", value + "px");
        }
        updateVariable();
    });

    // allow resizing of the buddy feed
    waitForElement([".Root__right-sidebar .LayoutResizer__input"], ([resizer]) => {
        const observer = new MutationObserver(updateVariable);
        observer.observe(resizer, { attributes: true, attributeFilter: ["value"] });
        function updateVariable() {
            let value = resizer.value;
            let min_value = version < 121200000 ? 321 : 281;
            if (value < min_value) {
                value = 72;
                document.documentElement.classList.add("buddyFeed-hide-text");
            } else {
                document.documentElement.classList.remove("buddyFeed-hide-text");
            }
        }
        updateVariable();
    });

    waitForElement([".main-nowPlayingBar-container"], ([nowPlayingBar]) => {
        const observer = new MutationObserver(updateVariable);
        observer.observe(nowPlayingBar, { childList: true });
        function updateVariable() {
            if (nowPlayingBar.childElementCount === 2) {
                document.documentElement.classList.add("connected");
            } else {
                document.documentElement.classList.remove("connected");
            }
        }
        updateVariable();
    });

    // add fade effect on playlist/folder list
    waitForElement([".main-navBar-navBar .os-viewport.os-viewport-native-scrollbars-invisible"], ([scrollNode]) => {
        scrollNode.setAttribute("fade", "bottom");
        scrollNode.addEventListener("scroll", () => {
            if (scrollNode.scrollTop == 0) {
                scrollNode.setAttribute("fade", "bottom");
            } else if (scrollNode.scrollHeight - scrollNode.clientHeight - scrollNode.scrollTop == 0) {
                scrollNode.setAttribute("fade", "top");
            } else {
                scrollNode.setAttribute("fade", "full");
            }
        });
    });

    waitForElement([`ul[tabindex="0"]`, `ul[tabindex="0"] .GlueDropTarget--playlists.GlueDropTarget--folders`], ([root, firstItem]) => {
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
                    uri = `spotify:playlist:${uid}`;
                } else if (app === "folder") {
                    const base64 = localStorage.getItem("dribbblish:folder-image:" + uid);
                    let img = link.querySelector("img");
                    if (!img) {
                        img = document.createElement("img");
                        img.classList.add("playlist-picture");
                        link.prepend(img);
                    }
                    img.src = base64 || "https://cdn.jsdelivr.net/gh/JulienMaille/dribbblish-dynamic-theme@main/images/tracklist-row-song-fallback.svg";
                    continue;
                }

                Spicetify.CosmosAsync.get(`sp://core-playlist/v1/playlist/${uri}/metadata`, { policy: { picture: true } }).then(res => {
                    const meta = res.metadata;
                    let img = link.querySelector("img");
                    if (!img) {
                        img = document.createElement("img");
                        img.classList.add("playlist-picture");
                        link.prepend(img);
                    }
                    img.src = meta.picture || "https://cdn.jsdelivr.net/gh/JulienMaille/dribbblish-dynamic-theme@main/images/tracklist-row-song-fallback.svg";
                });
            }
        }

        DribbblishShared.loadPlaylistImage = loadPlaylistImage;
        loadPlaylistImage();

        new MutationObserver(loadPlaylistImage).observe(listElem, { childList: true });
    });
}


/* ----------------------------------------------------------------------------------------- */

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

function lightenDarkenColor(h, p) {
    return (
        "#" +
        [1, 3, 5]
            .map((s) => parseInt(h.substr(s, 2), 16))
            .map((c) => parseInt((c * (100 + p)) / 100))
            .map((c) => (c < 255 ? c : 255))
            .map((c) => c.toString(16).padStart(2, "0"))
            .join("")
    );
}

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
    hsl = rgbToHsl(hexToRgb(hex));
    hsl[2] = lightness;
    return rgbToHex(hslToRgb(hsl));
}

let textColor = "#1db954";
let textColorBg = getComputedStyle(document.documentElement).getPropertyValue("--spice-main");

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
    //setRootColor("sidebar", setDark ? "#EAEAEA" : "#3D3D3D");
    setRootColor("player", textColorBg);
    setRootColor("shadow", textColorBg);
    setRootColor("card", setDark ? "#040404" : "#ECECEC");
    setRootColor("subtext", setDark ? "#EAEAEA" : "#3D3D3D");
    setRootColor("selected-row", setDark ? "#EAEAEA" : "#3D3D3D");
    setRootColor("main-elevated", setDark ? "#303030" : "#DDDDDD");
    setRootColor("notification", setDark ? "#303030" : "#DDDDDD");
    setRootColor("highlight-elevated", setDark ? "#303030" : "#DDDDDD");

    updateColors(textColor);
}

/* Init with current system light/dark mode */
let systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
toggleDark(systemDark);

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    toggleDark(e.matches);
});

waitForElement([".main-actionButtons"], (queries) => {
    // Add activator on top bar
    const buttonContainer = queries[0];

    const button = document.createElement("button");
    Array.from(buttonContainer.firstChild.attributes).forEach((attr) => {
        button.setAttribute(attr.name, attr.value);
    });
    button.id = "main-topBar-moon-button";
    button.className = buttonContainer.firstChild.className;
    button.onclick = () => {
        toggleDark();
    };
    button.innerHTML = `<svg role="img" viewBox="0 0 16 16" height="16" width="16"><path fill="currentColor" d="M9.598 1.591a.75.75 0 01.785-.175 7 7 0 11-8.967 8.967.75.75 0 01.961-.96 5.5 5.5 0 007.046-7.046.75.75 0 01.175-.786zm1.616 1.945a7 7 0 01-7.678 7.678 5.5 5.5 0 107.678-7.678z"></path></svg>`;

    const tooltip = Spicetify.Tippy(button, {
        ...Spicetify.TippyProps,
        content: "Light/Dark"
    });

    buttonContainer.insertBefore(button, buttonContainer.firstChild);
});

function updateColors(textColHex) {
    if (textColHex == undefined) return registerCoverListener();

    let isLightBg = isLight(textColorBg);
    if (isLightBg)
        textColHex = lightenDarkenColor(textColHex, -15); // vibrant color is always too bright for white bg mode
    else textColHex = setLightness(textColHex, 0.45);

    let darkColHex = lightenDarkenColor(textColHex, isLightBg ? 12 : -20);
    let darkerColHex = lightenDarkenColor(textColHex, isLightBg ? 30 : -40);
    let softHighlightHex = setLightness(textColHex, isLightBg ? 0.9 : 0.14);
    setRootColor("text", textColHex);
    setRootColor("button", darkerColHex);
    setRootColor("sidebar", darkerColHex);
    setRootColor("button-active", darkColHex);
    setRootColor("tab-active", softHighlightHex);
    setRootColor("button-disabled", softHighlightHex);
    let softerHighlightHex = setLightness(textColHex, isLightBg ? 0.9 : 0.1);
    setRootColor("highlight", softerHighlightHex);

    // compute hue rotation to change spotify green to main color
    let rgb = hexToRgb(textColHex);
    let m = `url('data:image/svg+xml;utf8,
      <svg xmlns="http://www.w3.org/2000/svg">
        <filter id="recolor" color-interpolation-filters="sRGB">
          <feColorMatrix type="matrix" values="
            0 0 0 0 ${rgb[0] / 255}
            0 0 0 0 ${rgb[1] / 255}
            0 0 0 0 ${rgb[2] / 255}
            0 0 0 1 0
          "/>
        </filter>
      </svg>
      #recolor')`;
    document.documentElement.style.setProperty("--colormatrix", encodeURI(m));
}

async function songchange() {
    if (!document.querySelector(".main-trackInfo-container")) return setTimeout(songchange, 300);
    try {
        // warning popup
        if (Spicetify.Platform.PlatformData.client_version_triple < "1.1.68") Spicetify.showNotification(`Your version of Spotify ${Spicetify.Platform.PlatformData.client_version_triple}) is un-supported`);
    } catch (err) {
        console.error(err);
    }

    let album_uri = Spicetify.Player.data.item.metadata.album_uri;
    let bgImage = Spicetify.Player.data.item.metadata.image_url;
    if (!bgImage) {
        bgImage = "/images/tracklist-row-song-fallback.svg";
        textColor = "#1db954";
        updateColors(textColor);
    }

    document.documentElement.style.setProperty("--image_url", `url("${bgImage}")`);
    pickCoverColor();
}

function getVibrant(image) {
    try {
        var swatches = new Vibrant(image, 12).swatches();
        cols = isLight(textColorBg) ? ["Vibrant", "DarkVibrant", "Muted", "LightVibrant"] : ["Vibrant", "LightVibrant", "Muted", "DarkVibrant"];
        for (var col in cols)
            if (swatches[cols[col]]) {
                textColor = swatches[cols[col]].getHex();
                break;
            }
    } catch (err) {
        console.error(err);
    }
}

function pickCoverColor() {
    const img = document.querySelector(".main-image-image.cover-art-image");
    if (!img) return setTimeout(pickCoverColor, 250); // Check if image exists

    // Force src for local files, otherwise we will pick color from previous cover
    if (Spicetify.Player.data.item.isLocal) img.src = Spicetify.Player.data.item.metadata.image_url;

    if (!img.complete) return setTimeout(pickCoverColor, 250); // Check if image is loaded

    textColor = "#1db954";
    if (Spicetify.Platform.PlatformData.client_version_triple >= "1.2.48" && img.src.startsWith("https://i.scdn.co/image")) {
        var imgCORS = new Image();
        imgCORS.crossOrigin = "anonymous"; // Enable CORS
        imgCORS.src = Spicetify.Player.data.item.metadata.image_url.replace("spotify:image:", "https://i.scdn.co/image/");

        imgCORS.onload = function () {
            var canvas = document.createElement("canvas");
            var ctx = canvas.getContext("2d");
            ctx.drawImage(imgCORS, 0, 0);

            getVibrant(imgCORS);
            imgCORS = null;
            updateColors(textColor);
        };
        return;
    } else {
        if (!img.src.startsWith("spotify:")) return;
    }

    if (img.complete) getVibrant(img);
    updateColors(textColor);
}

Spicetify.Player.addEventListener("songchange", songchange);
songchange();

(function Startup() {
    if (!Spicetify.showNotification) {
        setTimeout(Startup, 300);
        return;
    }
    // Check latest release
    fetch("https://api.github.com/repos/JulienMaille/spicetify-dynamic-theme/releases/latest")
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            if (data.tag_name > current) {
                const button = document.querySelector("#main-topBar-moon-button");
                button.classList.remove("main-topBar-buddyFeed");
                button.classList.add("main-actionButtons-button", "main-noConnection-isNotice");
                let updateLink = document.createElement("a");
                updateLink.setAttribute("href", "https://github.com/JulienMaille/spicetify-dynamic-theme/releases/latest");
                updateLink.innerHTML = `v${data.tag_name} available`;
                button.append(updateLink);
                button._tippy.setProps({
                    allowHTML: true,
                    content: `Changes: ${data.name}`
                });
            }
        })
        .catch((err) => {
            // Do something for an error here
        });
    Spicetify.showNotification("Applied system " + (systemDark ? "dark" : "light") + " theme.");
})();

document.documentElement.style.setProperty("--warning_message", " ");