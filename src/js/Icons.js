import { defaults } from "./Util";
import { parseSync as parseSVG, stringify as stringifySVG } from "svgson";

export default class Icons {
    /** @typedef {"custom" | "material:baseline" | "material:outline" | "material:round" | "material:sharp" | "material:twotone"} IconStyle */

    /**
     * @typedef {Object} IconOptions
     * @property {IconStyle} [style="round"]
     * @property {String} [className=""]
     * @property {Number} [size=16]
     * @property {Number} [scale=1]
     * @property {String} [fill="currentColor"]
     * @property {Boolean} [base64=false]
     */

    /** @type {Object.<String, Object.<IconStyle, String>>} */
    #icons;

    constructor() {
        this.#icons = process.env.DRIBBBLISH_ICONS;
    }

    /**
     * @param {String} name
     * @param {IconStyle} style
     * @returns {String}
     */
    getRawSVG(name, style) {
        if (style == null) style = this.#getDefaultStyle(name);
        if (!this.#icons.hasOwnProperty(name)) throw new Error(`Icon "${name}" does not exist`);

        if (!this.#icons[name].hasOwnProperty(style)) {
            const styles = Object.keys(this.#icons[name])
                .map((s) => `"${s}"`)
                .join(", ");
            throw new Error(`Icon "${name}" does not have style "${style}". It is available in styles [${styles}].`);
        }

        return this.#icons[name][style];
    }

    getAvailableStyles(name) {
        if (!this.#icons.hasOwnProperty(name)) throw new Error(`Icon "${name}" does not exist`);
        return Object.keys(this.#icons[name]);
    }

    /**
     * @param {String} name
     * @returns
     */
    #getDefaultStyle(name) {
        const styles = this.getAvailableStyles(name);
        for (const s of ["custom", "material:round"]) {
            if (styles.includes(s)) return s;
        }

        return styles[0];
    }

    /**
     * @param {String} name icon name lowercase with dashes like `ac-unit`
     * @param {IconOptions} options
     * @see https://fonts.google.com/icons?selected=Material+Icons
     * @returns
     */
    get(name, options) {
        /** @type {IconOptions} */
        const defaultOptions = {
            style: this.#getDefaultStyle(name),
            className: "",
            size: 16,
            scale: 1,
            fill: "currentColor",
            base64: false
        };
        options = defaults(options, defaultOptions);

        const svg = parseSVG(this.getRawSVG(name, options.style));

        // Add general / required attributes
        svg.attributes["icon-type"] = "dribbblish";
        svg.attributes["icon-name"] = name;
        svg.attributes["icon-style"] = options.style;
        svg.attributes.fill = options.fill;
        svg.attributes.width = options.size;
        svg.attributes.height = options.size;

        // Add className
        if (options.className != "") svg.attributes.class = options.className;

        // Add Styles
        // Create CSSStyleDeclaration by creating an element since there is no constructor for it
        const styles = document.createElement("a").style;
        if (options.scale != 1) {
            styles.transform = `scale(${options.scale})`;
            styles.transformOrigin = "center";
        }
        svg.children = svg.children.map((child) => {
            if (styles.cssText != "") child.attributes.style = styles.cssText;
            return child;
        });

        // Add title
        if (options.title != null) {
            svg.children.push({
                name: "title",
                type: "element",
                value: "",
                children: [{ name: "", type: "text", value: options.title, attributes: {}, children: [] }]
            });
        }

        if (options.base64) {
            return `data:image/svg+xml;base64,${Buffer.from(stringifySVG(svg)).toString("base64")}`;
        } else {
            return stringifySVG(svg);
        }
    }
}

export const icons = new Icons();
