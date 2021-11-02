const REGEX = /(?<key>.*?):.*?#(?<color>.*?)/gm;

module.exports = function (content, map, meta) {
    const matches = [...content.matchAll(REGEX)];
    const outLines = ["[base]"];

    for (let i = 0; i < matches.length; i++) {
        const { key, color } = matches[i].groups;
        outLines.push(`${key} = ${color}`);
    }

    return outLines.join("\n");
};
