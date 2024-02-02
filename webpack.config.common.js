const path = require('path');

module.exports = {
    entry: {
        app: './src/index'
    },
    output: {
        path: path.resolve('./dist'),
        filename: '[name].js',
        chunkFilename: '[name].chunk.js',
        hashFunction: 'sha256'
    },
    resolve: {
        modules: [path.resolve('.'), 'node_modules'],
        extensions: ['.js', '.jsx']
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: [{
                    loader: 'babel-loader',
                    options: {
                        cacheDirectory: true
                    }
                }]
            }
        ]
    }
};
