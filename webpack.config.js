const path = require('path')
const dotenv = require('dotenv').config()
const webpack = require('webpack')
// const SentryWebpackPlugin = require('@sentry/webpack-plugin')

const GENERAL_CONFIG = {
  mode: 'production',
  entry: './src/index.js',
  plugins: [],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: {
      name: 'misoSDK',
      type: 'umd'
    }
  }
}

const DEV_CONFIG = {
  mode: 'development',
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
  }
}

const PROD_CONFIG = {
  devtool: 'source-map'
}

module.exports = function (env, argv) {
  const release = env.mode === 'development' ? 'dev' : process.env.npm_package_version

  let ret = {
    ...GENERAL_CONFIG,
    ...PROD_CONFIG
  }
  if (env.mode === 'development') {
    ret = {
      ...GENERAL_CONFIG,
      ...DEV_CONFIG
    }
  // } else if (env.mode === 'production') {
  //   ret.plugins.push(
  //     new SentryWebpackPlugin({
  //       // sentry-cli configuration
  //       authToken: process.env.SENTRY_AUTH_TOKEN,
  //       org: 'askmiso',
  //       project: 'shopify-js-sdk',
  //       release,
  //       // webpack-specific configuration
  //       include: '.',
  //       ignore: ['node_modules', 'webpack.config.js']
  //     })
  //   )
  }
  ret.plugins.push(
    new webpack.DefinePlugin({
      'process.env': JSON.stringify({
        ...dotenv.parsed,
        release
      })
    })
  )
  return ret
}
