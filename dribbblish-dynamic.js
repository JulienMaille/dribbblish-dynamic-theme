let current = "1.4";

function waitForElement(els, func, timeout = 100) {
    const queries = els.map((el) => document.querySelector(el));
    if (queries.every((a) => a)) {
        func(queries);
    } else if (timeout > 0) {
        setTimeout(waitForElement, 300, els, func, --timeout);
    }
}

/* Playback item resolver. Spotify 1.3.4 removed `Spicetify.Player.data.track`
 * (and some builds drop `Player.data` entirely); the live state is
 * `Spicetify.Platform.PlayerAPI._state.item`, same metadata shape. Old paths
 * stay first for backward compatibility with older Spotify builds. */
function getPlaybackItem() {
    try {
        return Spicetify.Player?.data?.item ?? Spicetify.Player?.data?.track ?? Spicetify.Platform?.PlayerAPI?._state?.item ?? null;
    } catch {
        return null;
    }
}

let DribbblishShared = {};

// back shadow
waitForElement([".Root__top-container"], ([topContainer]) => {
    const cover = document.createElement("div");
    cover.id = "dribbblish-back-cover";
    topContainer.prepend(cover);
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

                Spicetify.CosmosAsync.get(`sp://core-playlist/v1/playlist/${uri}/metadata`, { policy: { picture: true } }).then((res) => {
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
    ((r /= 255), (g /= 255), (b /= 255));
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

/* ------------------------------------------------------------------------- */
/* Cover / colour extraction (ported from spicetify-dynamic-theme)            */
/* ------------------------------------------------------------------------- */

const colorCache = new Map();
const HEX_RE = /^#[0-9a-f]{6}$/i;
const EXTRACTOR_KEYS = ["VIBRANT", "VIBRANT_NON_ALARMING", "PROMINENT", "LIGHT_VIBRANT", "DESATURATED", "DARK_VIBRANT"];
const isValidHex = (h) => typeof h === "string" && HEX_RE.test(h.trim());

function isSkippedUri(uri) {
    if (!uri || uri.startsWith("spotify:local") || uri.startsWith("spotify:ad")) return true;
    try {
        const item = getPlaybackItem();
        if (item?.isLocal || item?.provider === "ad") return true;
    } catch {
        /* ignore */
    }
    return false;
}

function setCachedColor(uri, hex) {
    try {
        if (colorCache.size >= 200) {
            const oldest = colorCache.keys().next().value;
            if (oldest !== undefined) colorCache.delete(oldest);
        }
        colorCache.set(uri, hex);
    } catch {
        /* ignore */
    }
}

function pickFromPalette(pal) {
    if (!pal) return null;
    const upper = {};
    for (const k of Object.keys(pal)) upper[k.toUpperCase()] = pal[k];
    for (const k of EXTRACTOR_KEYS) {
        const v = upper[k];
        if (typeof v === "string" && isValidHex(v.trim())) return v.trim();
    }
    return null;
}

async function tryExtractor(uri) {
    if (!uri || isSkippedUri(uri)) return null;
    if (colorCache.has(uri)) {
        const cached = colorCache.get(uri);
        if (isValidHex(cached)) return cached;
        colorCache.delete(uri);
    }
    if (!Spicetify.colorExtractor) return null;
    const pal = await Spicetify.colorExtractor(uri);
    const hex = pickFromPalette(pal);
    if (hex) setCachedColor(uri, hex);
    return hex;
}

/* Cover metadata URLs are `spotify:image:<hash>`; CSS backgrounds need https. */
function toHttpCover(u) {
    if (!u) return u;
    if (/^spotify:image:/i.test(u)) return u.replace(/^spotify:image:/i, "https://i.scdn.co/image/");
    return u;
}

function getCoverUrls() {
    const d = Spicetify.Player?.data ?? Spicetify.Platform?.PlayerAPI?._state;
    const md = d?.item?.metadata ?? d?.track?.metadata ?? {};
    return { uri: d?.item?.uri ?? d?.track?.uri ?? md.album_uri, urls: [md.image_xlarge_url, md.image_large_url, md.image_url].filter(Boolean), meta: md };
}

/* Inline the cover as a data: URL so it always paints as a CSS background.
 * Remote https:// URLs intermittently fail to paint from user.css in some
 * Spotify builds even though <img> loads them fine. The blurred backdrop
 * (#dribbblish-back-cover, blur(50px)) hides the low resolution. */
const bgDataCache = new Map();
function coverToDataURL(httpUrl, trackUri) {
    try {
        if (!httpUrl || !/^https?:/i.test(httpUrl)) return;
        const key = trackUri || httpUrl;
        if (bgDataCache.has(key)) {
            const hit = bgDataCache.get(key);
            if (hit) document.documentElement.style.setProperty("--image_url", `url("${hit}")`);
            return;
        }
        if (bgDataCache.size >= 20) bgDataCache.delete(bgDataCache.keys().next().value);
        bgDataCache.set(key, null); // mark in-flight so we don't stack loaders
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function () {
            try {
                const S = 256;
                const cv = document.createElement("canvas");
                cv.width = S;
                cv.height = S;
                const cx = cv.getContext("2d");
                if (!cx) return;
                const iw = img.naturalWidth || S,
                    ih = img.naturalHeight || S;
                const sc = Math.max(S / iw, S / ih);
                const dw = iw * sc,
                    dh = ih * sc;
                cx.drawImage(img, (S - dw) / 2, (S - dh) / 2, dw, dh);
                const du = cv.toDataURL("image/jpeg", 0.82);
                bgDataCache.set(key, du);
                // Only apply if this track is still current.
                const now = getCoverUrls();
                if ((now.uri || now.urls[0]) === key || toHttpCover(now.urls[0]) === httpUrl) document.documentElement.style.setProperty("--image_url", `url("${du}")`);
            } catch (e) {
                try {
                    bgDataCache.delete(key);
                } catch (_e) {}
            }
        };
        img.onerror = function () {
            try {
                bgDataCache.delete(key);
            } catch (e) {}
        };
        img.src = httpUrl;
    } catch (e) {}
}

/* ------------------------------------------------------------------------- */
/* Theme variable writes                                                      */
/* ------------------------------------------------------------------------- */

/* toggleDark() + updateColors() issue ~30 setProperty calls. Queue them and
 * apply once in a single rAF. The light-mode gate lives on html[data-theme]
 * (cheap equality selector) instead of html[style*="--is_light"] (substring
 * match re-evaluated on every style mutation). It is applied AFTER all color
 * vars in the same flush so gated selectors restyle once, not twice. */
let _pendingThemeVars = null;
let _themeFlushQueued = false;
let _switchClearTimer = null;
let _pendingLightGate = null; // "light" | "dark" | null
let _flushRaf = null;
let _flushTimer = null;

function flushThemeVars() {
    if (!_themeFlushQueued) return;
    _themeFlushQueued = false;
    if (_flushRaf !== null) {
        try {
            cancelAnimationFrame(_flushRaf);
        } catch (e) {}
        _flushRaf = null;
    }
    if (_flushTimer !== null) {
        clearTimeout(_flushTimer);
        _flushTimer = null;
    }
    const batch = _pendingThemeVars;
    _pendingThemeVars = null;
    const gate = _pendingLightGate;
    _pendingLightGate = null;
    if ((!batch || batch.size === 0) && !gate) return;
    if (!document.documentElement) return;
    const rootStyle = document.documentElement.style;
    if (batch) for (const [k, v] of batch) rootStyle.setProperty(k, v);
    if (gate) {
        // --is_light drives the existing opacity calc()s in user.css;
        // data-theme is the new cheap gate for light-only rules.
        rootStyle.setProperty("--is_light", gate === "light" ? 1 : 0);
        document.documentElement.dataset.theme = gate;
    }
}

function queueThemeVar(name, value) {
    if (!_pendingThemeVars) _pendingThemeVars = new Map();
    _pendingThemeVars.set(name, value);
    if (_themeFlushQueued) return;
    _themeFlushQueued = true;
    /* One write pass per frame, but never only rAF: Chromium stops rAF when the
     * window is hidden (minimized, or fully behind another window), which left
     * the whole theme unapplied until the user focused Spotify again. The timer
     * is the safety net; whichever fires first cancels the other. */
    try {
        _flushRaf = requestAnimationFrame(flushThemeVars);
    } catch (e) {
        _flushRaf = null;
    }
    _flushTimer = setTimeout(flushThemeVars, 50);
}

let textColor = "#1db954";
let textColorBg = getComputedStyle(document.documentElement).getPropertyValue("--spice-main");

function setRootColor(name, colHex) {
    if (!document.documentElement) return;
    queueThemeVar("--spice-" + name, colHex);
    queueThemeVar("--spice-rgb-" + name, hexToRgb(colHex).join(","));
}

let _lastToggleAt = 0;
let _lastToggleDark = null;

function toggleDark(setDark) {
    if (setDark === undefined) setDark = isLight(textColorBg);

    /* Skip redundant same-mode passes (e.g. the system-preference event firing
     * right after a moon-button toggle): same mode within 800ms is a no-op —
     * opposite-mode double-clicks still apply. */
    try {
        const now = performance.now();
        if (setDark === _lastToggleDark && now - _lastToggleAt < 800) return;
        _lastToggleAt = now;
        _lastToggleDark = setDark;
    } catch (e) {}

    /* Switch blackout: every crossfade frame would otherwise repaint the
     * fullscreen blurred backdrop. Flag the switch synchronously so user.css
     * drops that transition for ~350ms (0.25s crossfade + margin). */
    try {
        document.documentElement.dataset.switching = "1";
        if (_switchClearTimer) clearTimeout(_switchClearTimer);
        _switchClearTimer = setTimeout(() => {
            try {
                document.documentElement.removeAttribute("data-switching");
            } catch (e) {}
            _switchClearTimer = null;
        }, 350);
    } catch (e) {}

    // Light-mode gate flips in the rAF flush AFTER all color vars
    // (see queueThemeVar) so gated selectors restyle once, not twice.
    _pendingLightGate = setDark ? "dark" : "light";
    textColorBg = setDark ? "#0A0A0A" : "#FAFAFA";

    setRootColor("main", textColorBg);
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

/* Spotify 1.3.x topbar. `.main-actionButtons` still exists on 1.3.5.3058
 * (verified live), but the old code cloned the first child's classes, which
 * are Spotify's own and paint a square behind the icon. The button now gets
 * its own class and is styled in user.css. Host resolution falls back to the
 * stable topbar hooks and finally to a structural button-row walk. */
const MOON_HOST_SELECTORS = [".main-actionButtons", '[data-testid="topbar-content-wrapper"]', '[data-testid="topbar-content"]', '[data-testid="topbar"]'];

function findMoonHost() {
    for (const sel of MOON_HOST_SELECTORS) {
        const el = document.querySelector(sel);
        if (el) return el;
    }
    try {
        const avatar = document.querySelector('[data-testid="user-widget-link"]');
        if (avatar) {
            let p = avatar.parentElement;
            let depth = 0;
            while (p && depth < 6) {
                try {
                    if (p.querySelectorAll("button").length >= 2) return p;
                } catch (e) {}
                p = p.parentElement;
                depth++;
            }
        }
    } catch (e) {}
    const header = document.querySelector('[data-testid="topbar"]') || document.querySelector(".Root__globalNav");
    if (!header) return null;
    let best = null;
    for (const btn of header.querySelectorAll('button, [role="button"]')) {
        const row = btn.parentElement;
        if (!row || row === header) continue;
        const count = row.querySelectorAll(':scope > button, :scope > [role="button"]').length;
        if (count >= 2 && (!best || count > best.count)) best = { el: row, count: count };
    }
    return best ? best.el : header;
}

let moonTippy = null;
function ensureMoonButton() {
    try {
        if (document.getElementById("main-topBar-moon-button")) return true;
        const host = findMoonHost();
        if (!host) return false;

        const button = document.createElement("button");
        button.id = "main-topBar-moon-button";
        button.type = "button";
        // Styling hook only (.main-topBar-buddyFeed is ours, not a Spotify class).
        button.className = "main-topBar-buddyFeed";
        button.setAttribute("aria-label", "Light/Dark");
        button.onclick = () => {
            toggleDark();
        };
        button.innerHTML = `<svg role="img" viewBox="0 0 16 16" height="16" width="16"><path fill="currentColor" d="M9.598 1.591a.75.75 0 01.785-.175 7 7 0 11-8.967 8.967.75.75 0 01.961-.96 5.5 5.5 0 007.046-7.046.75.75 0 01.175-.786zm1.616 1.945a7 7 0 01-7.678 7.678 5.5 5.5 0 107.678-7.678z"></path></svg>`;

        try {
            moonTippy = Spicetify.Tippy(button, {
                ...Spicetify.TippyProps,
                content: "Light/Dark"
            });
        } catch (e) {}

        host.insertBefore(button, host.firstChild);
        return true;
    } catch (e) {
        return false;
    }
}

// Bounded retry: the topbar may not be mounted yet at script load.
function waitForMoonHost(retries = 0) {
    if (ensureMoonButton()) return;
    if (retries >= 100) return;
    setTimeout(() => waitForMoonHost(retries + 1), 300);
}
waitForMoonHost();

// React re-renders the topbar on route changes and can drop the button.
try {
    ["pushstate", "popstate", "popstateend"].forEach((ev) => document.addEventListener(ev, () => setTimeout(ensureMoonButton, 300)));
} catch (e) {}

(function watchTopbar() {
    let retryTimer = null;
    const attach = (root) => {
        if (!root || root.__dribbblishMoonObserver) return;
        try {
            const mo = new MutationObserver(() => {
                if (document.getElementById("main-topBar-moon-button") || retryTimer) return;
                retryTimer = setTimeout(() => {
                    retryTimer = null;
                    ensureMoonButton();
                }, 300);
            });
            mo.observe(root, { childList: true, subtree: true });
            root.__dribbblishMoonObserver = mo;
        } catch (e) {}
    };
    waitForElement(["#global-nav-bar"], ([nav]) => attach(nav));
})();

function updateColors(textColHex) {
    if (textColHex == undefined) return;

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
    // Batched with the rest of the theme vars so toggleDark()+updateColors()
    // flush in a single rAF (one style recalc instead of ~17 synchronous ones).
    queueThemeVar("--colormatrix", encodeURI(m));
}

/* Track change. Spotify 1.3.x dropped `.main-trackInfo-container` (the old
 * gate) and `.track` on Player.data, so the previous version retried forever
 * and never recoloured the theme. The background is set before any DOM work
 * so it can never be blocked by a missing node. */
async function songchange(event, retries = 0) {
    const dataItem = event?.data?.item ?? getPlaybackItem();
    const meta = dataItem?.metadata;
    if (!dataItem || !meta) {
        if (retries >= 20) return;
        return setTimeout(() => songchange(event, retries + 1), 300);
    }

    try {
        // warning popup
        if (version < 110680000) Spicetify.showNotification(`Your version of Spotify (${Spicetify.Platform.PlatformData.client_version_triple || version}) is un-supported`);
    } catch (err) {
        console.error(err);
    }

    const FALLBACK_IMAGE = "https://cdn.jsdelivr.net/gh/JulienMaille/dribbblish-dynamic-theme@main/images/tracklist-row-song-fallback.svg";
    const trackUri = dataItem.uri ?? meta.album_uri;
    const albumUri = meta.album_uri;
    const isAd = dataItem.provider === "ad";

    let bgImage = toHttpCover(meta.image_xlarge_url || meta.image_large_url || meta.image_url);

    // Ads get the neutral fallback; local files keep their generated cover.
    if (!bgImage || isAd) {
        document.documentElement.style.setProperty("--image_url", `url("${FALLBACK_IMAGE}")`);
        textColor = "#1db954";
        updateColors(textColor);
        return;
    }

    document.documentElement.style.setProperty("--image_url", `url("${bgImage}")`);
    try {
        coverToDataURL(bgImage, trackUri);
    } catch (e) {}

    pickCoverColor(bgImage, trackUri, albumUri);
}

function getVibrant(image) {
    try {
        var swatches = new Vibrant(image, 12).swatches();
        const cols = isLight(textColorBg) ? ["Vibrant", "DarkVibrant", "Muted", "LightVibrant"] : ["Vibrant", "LightVibrant", "Muted", "DarkVibrant"];
        for (const col of cols)
            if (swatches[col]) {
                textColor = swatches[col].getHex();
                break;
            }
    } catch (err) {
        console.error(err);
    }
}

/* Colour resolution order: Spotify's CORS-free extractor (track, then album),
 * GraphQL extracted colour, then Vibrant from the cover bitmap. Every step is
 * guarded and the theme always ends up recoloured, even on failure. */
async function pickCoverColor(httpCoverUrl, trackUri, albumUri) {
    if (!httpCoverUrl || !trackUri) {
        const cover = getCoverUrls();
        if (!httpCoverUrl) httpCoverUrl = toHttpCover(cover.urls[0]);
        if (!trackUri) trackUri = cover.uri;
        if (!albumUri) albumUri = cover.meta.album_uri;
    }

    if (!httpCoverUrl && !trackUri) {
        updateColors(textColor);
        return;
    }

    if (trackUri && isSkippedUri(trackUri)) {
        updateColors(textColor || "#1db954");
        return;
    }

    const prevColor = textColor;

    // Primary: CORS-free extractor via spclient (trackUri, then album_uri)
    try {
        if (Spicetify.colorExtractor && trackUri) {
            const hex = await tryExtractor(trackUri);
            if (hex) {
                textColor = hex;
                updateColors(textColor);
                return;
            }
            if (albumUri && albumUri !== trackUri && !isSkippedUri(albumUri)) {
                const albumHex = await tryExtractor(albumUri);
                if (albumHex) {
                    textColor = albumHex;
                    updateColors(textColor);
                    return;
                }
            }
        }
    } catch (err) {
        console.error(err);
    }

    // Secondary: GraphQL extracted colour for the track entity
    try {
        if (trackUri && Spicetify.GraphQL?.Request && Spicetify.GraphQL?.Definitions?.fetchExtractedColorForTrackEntity) {
            const res = await Spicetify.GraphQL.Request(Spicetify.GraphQL.Definitions.fetchExtractedColorForTrackEntity, { uri: trackUri });
            const hex = res?.data?.trackUnion?.albumOfTrack?.coverArt?.extractedColors?.colorDark?.hex;
            if (isValidHex(hex)) {
                textColor = hex.trim();
                setCachedColor(trackUri, textColor);
                updateColors(textColor);
                return;
            }
        }
    } catch (err) {
        console.error(err);
    }

    // Tertiary: Vibrant from the cover URL
    if (typeof Vibrant === "undefined" || !httpCoverUrl) {
        if (!isValidHex(textColor)) textColor = "#1db954";
        updateColors(textColor);
        return;
    }

    const imgCORS = new Image();
    imgCORS.crossOrigin = "anonymous";

    imgCORS.onload = function () {
        getVibrant(imgCORS);
        if (!isValidHex(textColor)) textColor = isValidHex(prevColor) ? prevColor : "#1db954";
        updateColors(textColor);
    };

    imgCORS.onerror = function () {
        if (!isValidHex(textColor)) textColor = isValidHex(prevColor) ? prevColor : "#1db954";
        updateColors(textColor);
    };

    imgCORS.src = httpCoverUrl;
}

Spicetify.Player.addEventListener("songchange", songchange);
songchange();

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
                const button = document.querySelector("#main-topBar-moon-button");
                if (button) {
                    button.classList.remove("main-topBar-buddyFeed");
                    button.classList.add("main-actionButtons-button", "main-noConnection-isNotice");
                    let updateLink = document.createElement("a");
                    updateLink.setAttribute("href", "https://github.com/JulienMaille/dribbblish-dynamic-theme/releases/latest");
                    updateLink.innerHTML = `v${data.tag_name} available`;
                    button.append(updateLink);
                    try {
                        (moonTippy || button._tippy)?.setProps({
                            allowHTML: true,
                            content: `Changes: ${data.name}`
                        });
                    } catch (e) {}
                }
            }
        })
        .catch((err) => {
            // Do something for an error here
        });
    Spicetify.showNotification("Applied system " + (systemDark ? "dark" : "light") + " theme.");
})();

document.documentElement.style.setProperty("--warning_message", " ");
