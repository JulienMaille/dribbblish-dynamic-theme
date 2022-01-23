import webpack from "webpack";
import sass from "sass";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import path from "path";
import fs from "fs";

import Icons from "./src/js/Icons";
import { lightOffset, spiceColor } from "./src/js/SassUtil";

const _icons = {};
function addIcon(name, style, path) {
    name = name.replace(/_/g, "-");
    if (!_icons.hasOwnProperty(name)) _icons[name] = {};
    _icons[name][style] = fs.readFileSync(path, { encoding: "utf8" });
}
// Add Material Icons
let iconDir = path.resolve(__dirname, "node_modules/@material-icons/svg/svg");
for (const dir of fs.readdirSync(iconDir)) {
    for (const file of fs.readdirSync(path.resolve(iconDir, dir))) {
        addIcon(dir, `material:${file.replace(/\..*?$/, "")}`, path.resolve(iconDir, dir, file));
    }
}
// Add Custom Icons
iconDir = path.resolve(__dirname, "src/icons");
for (const icon of fs.readdirSync(iconDir)) {
    addIcon(icon.replace(/\..*?$/, ""), "custom", path.resolve(iconDir, icon));
}

const icons = new Icons(_icons);

/** @type {import('webpack').Configuration} */
const config = {
    mode: "development",
    entry: [path.resolve(__dirname, "src/js/main.js"), path.resolve(__dirname, "src/styles/main.scss"), path.resolve(__dirname, "src/styles/Colors.scss")],
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "dribbblish-dynamic.js"
    },
    module: {
        rules: [
            {
                include: path.resolve(__dirname, "src/js/main.js"),
                use: []
            },
            {
                include: path.resolve(__dirname, "src/styles/main.scss"),
                type: "asset/resource",
                generator: {
                    filename: "user.css"
                },
                use: [
                    {
                        loader: "sass-loader",
                        options: {
                            implementation: sass,
                            sourceMap: true,
                            sassOptions: {
                                functions: {
                                    "lightOffset($n, $offset)": (n, offset) => {
                                        return new sass.types.String(lightOffset(n.getValue(), offset.getValue()));
                                    },
                                    "spiceColor($key, $alpha: 1, $light-offset: 0)": (key, alpha, _lightOffset) => {
                                        return new sass.types.String(spiceColor(key.getValue(), alpha.getValue(), _lightOffset.getValue()));
                                    },
                                    "font64($font)": (font) => {
                                        const file = path.resolve(__dirname, "src/fonts", font.getValue());
                                        return new sass.types.String(`"data:font/truetype;charset=utf-8;base64,${fs.readFileSync(file, { encoding: "base64" })}"`);
                                    },
                                    'icon64($name, $options: "{}")': (name, options) => {
                                        name = name.getValue();
                                        options = JSON.parse(options.getValue());
                                        return new sass.types.String(icons.get(name, { ...options, base64: true }));
                                    }
                                }
                            }
                        }
                    }
                ]
            },
            {
                include: path.resolve(__dirname, "src/styles/Colors.scss"),
                type: "asset/resource",
                generator: {
                    filename: "color.ini"
                },
                use: [path.resolve(__dirname, "src/loaders/color-loader.js")]
            }
        ]
    },
    devtool: "inline-source-map",
    plugins: [
        new webpack.DefinePlugin({
            "process.env.BUG_REPORT": JSON.stringify(
                fs
                    .readFileSync(path.resolve(__dirname, ".github/ISSUE_TEMPLATE/bug_report.md"), { encoding: "utf8" })
                    .replace(/^---(.*?\r?\n)+---(.*?\r?\n)*?(?=\S)/, "") // Replace GitHub header
                    .replace(/\*\*Desktop Setup\*\*\r?\n(- .*?\r?\n)+\r?\n/, "") // Replace **Desktop Setup** block
            ),
            "process.env.DRIBBBLISH_ICONS": JSON.stringify(_icons),
            "process.env.DRIBBBLISH_VERSION": JSON.stringify(process.env.DRIBBBLISH_VERSION ?? "Dev"),
            "process.env.COMMIT_HASH": JSON.stringify(process.env.COMMIT_HASH ?? "local")
        }),
        new CleanWebpackPlugin({
            protectWebpackAssets: false,
            cleanAfterEveryBuildPatterns: ["*.LICENSE.txt"]
        })
    ]
};

export default config;
