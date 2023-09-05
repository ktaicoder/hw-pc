import path from 'path'

/**
 * @param {string[]} pathFragment
 * @returns {string}
 */
const rootResolve = (...pathFragment) => path.resolve(__dirname, ...pathFragment)

export const alias = {
  src: rootResolve('src'),
}
