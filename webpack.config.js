const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const path = require("path");

/** @type {import('webpack').Configuration} */
module.exports = {
    entry: [path.resolve(__dirname, "./src/js/main.js"), path.resolve(__dirname, "./src/styles/main.scss"), path.resolve(__dirname, "./src/styles/Colors.scss")],
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "dribbblish-dynamic.js"
    },
    module: {
        rules: [
            {
                test: /main\.js$/,
                exclude: /node_modules/,
                use: []
            },
            {
                test: /main\.scss$/,
                exclude: /node_modules/,
                type: "asset/resource",
                generator: {
                    filename: "user.css"
                },
                use: [
                    {
                        loader: "sass-loader",
                        options: {
                            sourceMap: true
                        }
                    }
                ]
            },
            {
                test: /Colors\.scss$/,
                exclude: /node_modules/,
                type: "asset/resource",
                generator: {
                    filename: "color.ini"
                },
                use: [path.resolve(__dirname, "./src/loaders/color-loader.js")]
            },
            {
                test: /\.svg/,
                exclude: /node_modules/,
                use: ["raw-loader"]
            }
        ]
    },
    devtool: "inline-source-map",
    plugins: [
        new CleanWebpackPlugin({
            protectWebpackAssets: false,
            cleanAfterEveryBuildPatterns: ["*.LICENSE.txt"]
        }),
        new webpack.DefinePlugin({
            "process.env.DRIBBBLISH_VERSION": JSON.stringify(process.env.DRIBBBLISH_VERSION || "Dev"),
            "process.env.COMMIT_HASH": JSON.stringify(process.env.COMMIT_HASH || "local")
        }),
        new CopyPlugin({
            patterns: [{ from: "src/assets", to: "assets" }]
        })
    ],
    optimization: {
        minimize: true,
        minimizer: [`...`, new CssMinimizerPlugin()]
    }
};
