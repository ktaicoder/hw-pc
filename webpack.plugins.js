// eslint-disable-next-line @typescript-eslint/no-var-requires
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = [
    new ForkTsCheckerWebpackPlugin({
        typescript: {
            // 기본값 2048은 개발모드에서 메모리 부족 에러가 발생
            memoryLimit: 8 * 1026
        }
    })
];
