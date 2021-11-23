import MarkdownIt from "markdown-it";
import MarkdownItAttrs from "markdown-it-attrs";
import MarkdownItBracketedSpans from "markdown-it-bracketed-spans";

/**
 * @callback waitForElCb
 * @param {HTMLElement[]} queries
 */

/**
 *
 * @param {String[]} els
 * @param {waitForElCb} cb
 * @param {Number} [tries=100]
 * @param {Number} [interval=300]
 */
export function waitForElement(els, cb, tries = 100, interval = 300) {
    const queries = els.map((el) => document.querySelector(el));
    if (queries.every((a) => a)) {
        cb(queries);
    } else if (tries > 0) {
        setTimeout(waitForElement, interval, els, cb, --tries);
    }
}

export function copyToClipboard(text) {
    var input = document.createElement("textarea");
    input.style.display = "fixed";
    input.innerHTML = text;
    document.body.appendChild(input);
    input.select();
    var result = document.execCommand("copy");
    document.body.removeChild(input);
    return result;
}

export function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

export function getClosestToNum(arr, num) {
    return arr.reduce((prev, curr) => (Math.abs(curr - num) < Math.abs(prev - num) ? curr : prev));
}

export function renderMD(src, env) {
    const md = MarkdownIt({
        html: true,
        breaks: true,
        linkify: true,
        typographer: true
    });
    md.use(MarkdownItBracketedSpans);
    md.use(MarkdownItAttrs);

    return md.render(src, env);
}

export function htmlToNode(htmlStr) {
    var div = document.createElement("div");
    div.innerHTML = htmlStr.trim();
    return div.firstChild;
}

export function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFromArray(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export function debounce(func, wait, immediate) {
    var timeout;
    return function () {
        var context = this,
            args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}
