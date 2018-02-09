// config-overrides.js
var paths = require('react-scripts-ts/config/paths');
const ParallelUglifyPlugin = require('webpack-parallel-uglify-plugin');

module.exports = function override(config) {
    config.module.rules.push({
        test: /ideogram.*\.(js|jsx)$/,
        loader: require.resolve('babel-loader'),
        options: {
            //babelrc: true,
            //presets: [require.resolve('babel-preset-react-app')],
            cacheDirectory: true,
        },
    });
    config.module.rules.push({
        test: /tubemap.*\.(js|jsx)$/,
        loader: require.resolve('babel-loader'),
        options: {
            //babelrc: true,
            //presets: [require.resolve('babel-preset-react-app')],
            cacheDirectory: true,
        },
    });
/*
  config.plugins.push(new ParallelUglifyPlugin({
    sourceMap: true,
    uglifyES: {}
  }));
*/
    return config
}
