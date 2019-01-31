const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

const TEMPLATE_PATH = path.join(__dirname, '../index.html');

let plugins = [
    new HtmlWebpackPlugin({
        title: 'Soliditypp Debugger',
        template: TEMPLATE_PATH,
        inlineSource: '.+',
    }),
    new HtmlWebpackInlineSourcePlugin(),
    new VueLoaderPlugin()
];

module.exports = plugins;
