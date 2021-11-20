const { parseSync: parseSVG, stringify: stringifySVG } = require("svgson");

module.exports = function (content, map, meta) {
    const query = new URLSearchParams(this.resourceQuery);
    const svg = parseSVG(content);

    svg.attributes.type = "icon";
    svg.attributes.width = query.get("width") ?? 16;
    svg.attributes.height = query.get("height") ?? 16;

    svg.children = svg.children.map((c) => {
        if (c.attributes.fill != null && query.has("fill")) c.attributes.fill = query.get("fill");
        return c;
    });

    const svgStr = stringifySVG(svg);
    if (query.has("base64")) {
        return `data:image/svg+xml;base64,${Buffer.from(svgStr).toString("base64")}`;
    } else {
        return svgStr;
    }
};
