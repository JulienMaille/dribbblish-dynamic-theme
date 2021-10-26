const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const path = require("path");

module.exports = {
    entry: [path.resolve(__dirname, "./src/js/main.js"), path.resolve(__dirname, "./src/styles/main.scss")],
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "dribbblish-dynamic.js"
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: []
            },
            {
                test: /\.scss$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "file-loader",
                        options: { name: "user.css" }
                    },
                    "sass-loader"
                ]
            }
        ]
    },
    devtool: false,
    plugins: [
        new CleanWebpackPlugin(),
        new webpack.DefinePlugin({
            "process.env.DRIBBBLISH_VERSION": JSON.stringify((process.env.DRIBBBLISH_VERSION || "vDev").substring(1)) // Substring because the script expects the version to be `X.X.X` and not `vX.X.X`
        }),
        new webpack.SourceMapDevToolPlugin({}),
        new CopyPlugin({
            patterns: [{ from: "src/assets", to: "assets" }, { from: "src/color.ini" }]
        })
    ]
};
