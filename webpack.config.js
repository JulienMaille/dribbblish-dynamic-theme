const webpack = require("webpack");
const CopyPlugin = require("copy-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const path = require("path");

/** @type {import('webpack').Configuration} */
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
            "process.env.DRIBBBLISH_VERSION": JSON.stringify(process.env.DRIBBBLISH_VERSION || "Dev")
        }),
        new CopyPlugin({
            patterns: [{ from: "src/assets", to: "assets" }, { from: "src/color.ini" }]
        })
    ],
    optimization: {
        minimize: true,
        minimizer: [`...`, new CssMinimizerPlugin()]
    }
};
