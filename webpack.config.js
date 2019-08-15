var webpack = require('webpack');

module.exports = {
  target: "web",
  entry: {
    client: "./src/index.tsx",
  },
  output: {
    filename: '[name].js',
    path:  __dirname + "/build-ssr",
    //sourceMapFilename: "[name].js.map",
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loaders: ['babel'],
        exclude: /node_modules/
      },
      {
        test: /\.tsx?$/,
        loaders: ['ts-loader'],
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          { loader: 'css-loader', options: { importLoaders: 1 } },
          // 'postcss-loader'
         ],
        // exclude: /node_modules/
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          { loader: 'css-loader', options: { importLoaders: 1 } },
          'sass-loader',
          // 'postcss-loader'
         ],
        // exclude: /node_modules/
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.css', '.scss']
  },
};
