import type IForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin'
import path from 'path'
import CopyPlugin from 'copy-webpack-plugin'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')

export const plugins = [
  new ForkTsCheckerWebpackPlugin({
    logger: 'webpack-infrastructure',
    typescript: {
      // 기본값 2048은 개발모드에서 메모리 부족 에러가 발생
      memoryLimit: 8 * 1026,
    },
  }),
  new CopyPlugin({
    patterns: [
      {
        from: path.resolve(__dirname, 'public/static'),
        to: path.resolve(__dirname, '.webpack/renderer/main_window/static'),
      },
      {
        from: path.resolve(__dirname, 'build-resources'),
        to: path.resolve(__dirname, '.webpack/build-resources'),
      },
    ],
  }),
]
