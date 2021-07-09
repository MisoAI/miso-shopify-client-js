const path = require('path')
const dotenv = require('dotenv')
const webpack = require('webpack')

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  devServer: {
    static: path.resolve(__dirname, 'demo'),
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    hot: true,
    proxy: [
      {
        context: ['/products/*.js', '/cart/**', '/cart*'],
        target: 'http://localhost:3001'
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(dotenv.config().parsed)
    })
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: {
      name: 'misoSDK',
      type: 'umd'
    }
  }
}
