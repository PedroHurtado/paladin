const path = require('path');

module.exports = {
    mode: 'production',
    entry: {
       index: './src/index.js'
    },
    externals: {
        jquery: 'jQuery',
        angular:'angular'
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        publicPath: "/dist/",
        filename: '[name].bundle.js',
        chunkFilename: '[name].bundle.js',
        library: "Paladin",
        libraryTarget: "umd",
    },
    devtool: "source-map",
}