const { resolve } = require("path");

const CompressionPlugin = require("compression-webpack-plugin");
const Dotenv = require("dotenv-webpack");
require("dotenv/config");
const svgToMiniDataURI = require("mini-svg-data-uri");

const config = {
    mode: "production",
    entry: "./index.js",
    target: "node",
    node: { __dirname: false, __filename: false },
    stats: { errorDetails: true },
    output: {
        clean: true,
        path: resolve(__dirname, "dist"),
        publicPath: "/public/",
        filename: "spider.[name].bundle.js",
        chunkFilename: "spider.[name].chunk.js",
    },
    resolve: {
        modules: ["node_modules"],
    },
    devtool: "source-map",
    optimization: {
        moduleIds: "deterministic",
        runtimeChunk: "single",
        splitChunks: {
            chunks: "all",
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: "vendors",
                    chunks: "all",
                },
            },
        },
    },
    performance: {
        hints: "warning",
        assetFilter: (assetFilename) => assetFilename.endsWith(".js.gz"),
    },
    module: {
        rules: [
            {
                test: /\.m?jsx?$/i,
                exclude: /(node_modules|bower_components)/,
                resolve: { fullySpecified: false },
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env"],
                        plugins: ["@babel/plugin-proposal-object-rest-spread"],
                    },
                },
            },
            { test: /\.css$/i, use: ["style-loader", "css-loader"] },
            {
                test: /\.(png|jpe?g|gif)$/i,
                type: "asset/resource",
                generator: { filename: "assets/images/[hash][ext][query]" },
            },
            {
                test: /\.svg$/i,
                type: "asset/inline",
                generator: {
                    dataUrl: (content) => svgToMiniDataURI(content.toString()),
                },
            },
            { test: /\.txt$/, type: "asset", parser: { dataUrlCondition: { maxSize: 4 * 1024 } } },
            { resourceQuery: /raw/, type: "asset/source" },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/i,
                type: "asset/resource",
                generator: { filename: "assets/fonts/[hash][ext][query]" },
            },
        ],
    },
    plugins: [
        new CompressionPlugin({
            test: /\.js(\?.*)?$/i,
        }),
        new Dotenv({
            path: "./.env",
            safe: true,
            allowEmptyValues: true,
            defaults: true,
        }),
    ],
};

module.exports = config;
