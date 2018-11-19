const path = require('path');
const ngAnnotatePlugin = require('ng-annotate-webpack-plugin');
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
        })
    ],
    devtool: "source-map"
    

}