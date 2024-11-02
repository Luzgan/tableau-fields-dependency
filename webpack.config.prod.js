const commonConfig = require("./webpack.config.common.js");

const config = {
  ...commonConfig,
  mode: "production",
  bail: false,
  cache: {
    type: "filesystem",
    allowCollectingMemory: true,
  },
};

module.exports = config;
