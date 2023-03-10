/* eslint-disable @typescript-eslint/no-var-requires */
const rules = require('./webpack.rules')
const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')

const plugins = [
    ...require('./webpack.plugins'),
    new CopyPlugin({
        patterns: [
            {
                from: path.resolve(__dirname, 'public/static'),
                to: path.resolve(__dirname, '.webpack/renderer/main_window/static')
            },
            {
                from: path.resolve(__dirname, 'build-resources'),
                to: path.resolve(__dirname, '.webpack/build-resources')
            },
            // {
            //     from: path.resolve(__dirname, 'public/blockfactory'),
            //     to: path.resolve(__dirname, '.webpack/renderer/main_window/blockfactory')
            // },
        ]
    })
]

rules.push({
    test: /\.css$/,
    use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

module.exports = {
    module: {
        rules,
    },
    plugins: plugins,
    resolve: {
        extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
        alias: require('./webpack.alias')
    },
};
