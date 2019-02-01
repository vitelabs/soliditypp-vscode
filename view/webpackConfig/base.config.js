const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const plugins = require('./plugins.js');

const SRC_PATH = path.join(__dirname, '../');
const STATIC_PATH = path.join(__dirname, '../../out/view');
let development = ['dev', 'test'];

let config = {
    mode: development.indexOf(process.env.NODE_ENV) > -1 ? 'development' : 'production',
    devtool: 'source-map',

    entry: {
        index: path.join(SRC_PATH, '/index.js')
    },
    output: {
        path: STATIC_PATH
    },
    plugins,
    module: {
        rules: [{
            test: /\.vue$/,
            use: [{
                loader: 'vue-loader'
            }]
        }, {
            test: /\.(svg|png|jpg|gif)$/,
            loader: 'url-loader',
            query: {
                limit: 10 * 1024 //10KB
            }
        }, {
            test: /\.js$/,
            exclude: /node_modules(?!\/base-x)/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: [
                        '@babel/preset-env'
                    ],
                    plugins: [
                        '@babel/plugin-proposal-class-properties'
                    ]
                }
            }
        }, {
            test: /(\.scss$|\.css$|\.sass$)/,
            use: [{
                loader: 'style-loader'
            }, {
                loader: 'css-loader'
            }, {
                loader: 'sass-loader'
            }]
        }]
    },
    resolve: {
        alias: {
            vue: 'vue/dist/vue.js',
            src: SRC_PATH,
            components: path.join(SRC_PATH, '/components'),
            services: path.join(SRC_PATH, '/services'),
            utils: path.join(SRC_PATH, '/utils')
        },
        extensions: ['.js', '.scss', '.vue', '.json']
    }
};

if (config.mode === 'production') {
    config.optimization = {
        minimizer: [
            // we specify a custom UglifyJsPlugin here to get source maps in production
            new UglifyJsPlugin({
                cache: true,
                parallel: true,
                uglifyOptions: {
                    compress: false,
                    ecma: 6,
                    mangle: true
                },
                sourceMap: false
            })
        ]
    };
}

module.exports = config;