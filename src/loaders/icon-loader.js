module.exports = function (source) {
    return `
        module.exports = function(options) {
            const { parseSync: parseSVG, stringify: stringifySVG } = require("svgson");

            const defaultOptions = {
                size: 16,
                base64: false
            };
            options = { ...defaultOptions, ...options };
            const svg = parseSVG(\`${source}\`);

            svg.attributes.type = "icon";
            svg.attributes.width = options.size ?? options.width;
            svg.attributes.height = options.size ?? options.height;

            svg.children = svg.children.map((c) => {
                if (c.attributes.fill != null && options.fill != null) c.attributes.fill = options.fill;
                return c;
            });

            const svgStr = stringifySVG(svg);
            if (options.base64) {
                return \`data:image/svg+xml;base64,\${Buffer.from(svgStr).toString("base64")}\`;
            } else {
                return svgStr;
            }
        }
    `;
};
