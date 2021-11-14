/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path');

/**
 * @param {string[]} pathFragment
 * @returns {string}
 */
const rootResolve = (...pathFragment) => path.resolve(__dirname, ...pathFragment);


module.exports = {
    'src': rootResolve('src'),
};
