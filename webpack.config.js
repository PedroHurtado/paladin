const path = require('path');
const ngAnnotatePlugin = require('ng-annotate-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
module.exports = {
    mode: 'production',
    entry: {
        index: './src/index.js'
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        publicPath: "/dist/",
        filename: '[name].bundle.js',
        chunkFilename: '[name].bundle.js',
        library: "Paladin",

    },
    plugins: [
        new ngAnnotatePlugin({
            add: true,
        }),
        new CompressionPlugin(),
    ],
    devtool: "source-map"
    

}