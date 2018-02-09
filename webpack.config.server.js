var webpack = require('webpack');

module.exports = {
  target: 'node',
  entry: {
    server: './src/server.tsx'
  },
  output: {
    filename: '[name].js',
    sourceMapFilename: "[name].js.map",
    path: __dirname + '/build-ssr/'
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
        exclude: /node_modules/
      }/*,
      {
        test: /\.css$/,
        use: [
          'style-loader',
          { loader: 'css-loader', options: { importLoaders: 1 } },
          // 'postcss-loader'
         ],
        exclude: /node_modules/
      }*/
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.css']
  },
  node: {
    console: true,
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    stream: 'empty'
  },
  externals:[{
    xmlhttprequest: '{XMLHttpRequest:XMLHttpRequest}'
  }],
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    }),
    new webpack.IgnorePlugin(/vertx/)
  ]
};
