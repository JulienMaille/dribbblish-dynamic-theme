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
