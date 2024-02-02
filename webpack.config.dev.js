const commonConfig = require('./webpack.config.common.js');

const config = {
    ...commonConfig,
    mode: 'development',
    bail: false,
    devServer: {
        port: 9000,
        client: {
            overlay: false
        }
    }
};

module.exports = config;
