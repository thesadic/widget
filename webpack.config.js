const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        app: './src/app.js',
        widget: './widget.js'
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/'
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
        },
        port: 8080,
        proxy: {
            '/api': 'http://localhost:3000'
        },
        hot: true
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: 'src/index.html', to: 'index.html' },
                { from: 'src/styles.css', to: 'styles.css' },
                { from: 'widget.css', to: 'widget.css' },
                { from: 'widget.html', to: 'widget.html' },
                { from: 'src/*.svg', to: '[name][ext]' },
                { from: 'public/images', to: 'images' }
            ],
        }),
    ]
};
