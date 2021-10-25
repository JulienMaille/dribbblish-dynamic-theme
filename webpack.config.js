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
    }
};
