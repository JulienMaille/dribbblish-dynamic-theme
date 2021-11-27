import { parseSync as parseSVG, stringify as stringifySVG } from "svgson";

export default class Icons {
    /** @typedef {"baseline" | "outline" | "round" | "sharp" | "twotone"} IconStyle */

    /**
     * @typedef {Object} IconOptions
     * @property {IconStyle} [style="round"]
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
     * @param {String} name icon name lowercase with dashes like `ac-unit`
     * @param {IconOptions} options
     * @see https://fonts.google.com/icons?selected=Material+Icons
     * @returns
     */
    get(name, options) {
        /** @type {IconOptions} */
        const defaultOptions = {
            style: "round",
            size: 16,
            scale: 1,
            fill: "currentColor",
            base64: false
        };
        options = { ...defaultOptions, ...options };

        if (!this.#icons.hasOwnProperty(name)) throw new Error(`Icon "${name}" does not exist`);
        let svg;
        if (typeof this.#icons[name] == "string") {
            svg = parseSVG(this.#icons[name]);
        } else {
            if (!this.#icons[name].hasOwnProperty(options.style)) throw new Error(`Icon "${name}" does not have style "${options.style}"`);
            svg = parseSVG(this.#icons[name][options.style]);
        }

        svg.attributes.type = "dribbblish-icon";
        svg.attributes.fill = options.fill;
        svg.attributes.width = options.size;
        svg.attributes.height = options.size;

        if (options.scale != 1) {
            svg.children = svg.children.map((child) => {
                child.attributes.style = `transform: scale(${options.scale}); transform-origin: center;`;
                return child;
            });
        }

        if (options.title != null) {
            console.log(options);
            console.log(svg);
            svg.children.push({
                name: "title",
                type: "element",
                value: "",
                children: [{ name: "", type: "text", value: options.title, attributes: {}, children: [] }]
            });
            console.log(svg);
        }

        if (options.base64) {
            return `data:image/svg+xml;base64,${Buffer.from(stringifySVG(svg)).toString("base64")}`;
        } else {
            return stringifySVG(svg);
        }
    }
}

export const icons = new Icons();
