import path from 'path'
import os from 'os'
import { isDevelopmentOrTest } from './environment'

const isDev = isDevelopmentOrTest

export const isMac = process.platform === 'darwin'
export const isWindow = process.platform === 'win32'
export const isX64 = process.arch === 'x64'

/** src folder
 * 배포 실행중일때는 .webpack/renderer/main_window
 * 개발 중일때는 src 폴더이다
 */
// export const srcFolder = isDev ? path.resolve(__dirname, '..') : path.resolve(__dirname)
export const rootFolder = path.resolve(__dirname, '..')
export const buildResFolder = path.resolve(rootFolder, 'build-resources')
export const staticFolder = path.resolve(rootFolder, 'renderer/main_window/static')

export const developmentImageFolderPath = path.resolve(rootFolder, 'images')

const menuBarIconFileName = process.platform === 'darwin' ? 'menubarTemplate@2x.png' : 'menubar@2x.png'
export const MENUBAR_ICON_PATH = path.resolve(
  isDevelopmentOrTest ? buildResFolder : process.resourcesPath,
  menuBarIconFileName,
)

export const CHROME_ERROR_PATH = 'chrome-error://chromewebdata/'
export const LOGIN_REDIRECT_PATH = 'http://localhost:3000/?code='
export const DESKTOP_PATH = path.join(os.homedir(), 'Desktop')
export const LOG_FOLDER = isDevelopmentOrTest
  ? path.resolve(rootFolder, '..', 'logs')
  : isMac
  ? path.resolve(process.resourcesPath, '..', 'logs')
  : path.resolve(os.homedir(), '.aicodingblock', 'hw', 'logs')

export const DRIVER_FOLDER = path.resolve(staticFolder, 'drivers')
export const FIRMWARE_FOLDER = path.resolve(staticFolder, 'firmwares')

console.log({ rootFolder, staticFolder, buildResFolder, DRIVER_FOLDER })
