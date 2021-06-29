const path = require('path')

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  devServer: {
    static: path.resolve(__dirname, 'demo'),
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    hot: true
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: {
      name: 'misoSDK',
      type: 'umd'
    }
  }
}
