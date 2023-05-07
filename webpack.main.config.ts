import type { Configuration } from 'webpack'

import { rules } from './webpack.rules'

export const mainConfig: Configuration = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/index.ts',
  // Put your normal webpack config below here
  module: {
    rules,
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
    alias: require('./webpack.alias'),
  },
  //   externals: {
  //     serialport: 'serialport',
  //   },
  externals: ['serialport'],
  //   externals: {
  //     serialport: 'commonjs2 serialport', // Ref: https://copyprogramming.com/howto/electron-and-serial-ports
  //   },
}
