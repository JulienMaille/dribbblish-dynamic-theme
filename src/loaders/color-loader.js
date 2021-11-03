const TRIM_REGEX = /colors: \((?<colors>.*?)\);/s;
const COLOR_REGEX = /(?<key>[\w-]*?):.*?#(?<color>.*?),?$/gm;

module.exports = function (content, map, meta) {
    const colors = content
        .match(TRIM_REGEX)
        .groups.colors.split("\n")
        .map((l) => l.trim())
        .join("\n");
    const matches = [...colors.matchAll(COLOR_REGEX)];
    const ini = ["[base]"];
    for (let i = 0; i < matches.length; i++) {
        const { key, color } = matches[i].groups;
        ini.push(`${key} = ${color}`);
    }

    return ini.join("\n");
};
