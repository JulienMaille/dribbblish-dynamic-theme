const webpack = require("webpack");
const sass = require("sass");
const CopyPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const path = require("path");

/** @type {import('webpack').Configuration} */
module.exports = {
    entry: [path.resolve(__dirname, "./src/js/main.js"), path.resolve(__dirname, "./src/styles/main.scss"), path.resolve(__dirname, "./src/styles/Colors.scss")],
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "dribbblish-dynamic.js"
    },
    resolve: {
        extensions: [".js", ".svg"],
        alias: {
            icon: path.resolve(__dirname, "./src/icons")
        }
    },
    module: {
        rules: [
            {
                include: path.resolve(__dirname, "./src/js/main.js"),
                use: []
            },
            {
                include: path.resolve(__dirname, "./src/styles/main.scss"),
                type: "asset/resource",
                generator: {
                    filename: "user.css"
                },
                use: [
                    {
                        loader: "sass-loader",
                        options: {
                            implementation: sass,
                            sourceMap: true
                        }
                    }
                ]
            },
            {
                include: path.resolve(__dirname, "./src/styles/Colors.scss"),
                type: "asset/resource",
                generator: {
                    filename: "color.ini"
                },
                use: [path.resolve(__dirname, "./src/loaders/color-loader.js")]
            },
            {
                test: /\.svg/,
                type: "asset/source",
                resourceQuery: /.?/,
                use: [path.resolve(__dirname, "./src/loaders/icon-loader.js")]
            }
        ]
    },
    devtool: "inline-source-map",
    plugins: [
        new CopyPlugin({
            patterns: [{ from: "src/assets", to: "assets" }]
        }),
        new webpack.DefinePlugin({
            "process.env.DRIBBBLISH_VERSION": JSON.stringify(process.env.DRIBBBLISH_VERSION || "Dev"),
            "process.env.COMMIT_HASH": JSON.stringify(process.env.COMMIT_HASH || "local")
        }),
        new CleanWebpackPlugin({
            protectWebpackAssets: false,
            cleanAfterEveryBuildPatterns: ["*.LICENSE.txt"]
        })
    ]
};
