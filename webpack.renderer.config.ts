import type { Configuration } from 'webpack'
import { alias } from './webpack.alias'
import { rules } from './webpack.rules'
import { plugins } from './webpack.plugins'

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
})

rules.push({
  test: /\.svg$/,
  use: [{ loader: '@svgr/webpack' }, { loader: 'url-loader' }],
})

rules.push({
  test: /\.png$/,
  use: [{ loader: 'url-loader' }],
})

export const rendererConfig: Configuration = {
  module: {
    rules,
  },
  plugins,
  resolve: {
    alias,
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
  },
}
