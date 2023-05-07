import { app } from 'electron'
import path from 'path'
import { isDevelopmentOrTest } from './util/electron-is-development'

export const isMac = process.platform === 'darwin'
export const isWindow = process.platform === 'win32'
export const isX64 = process.arch === 'x64'

const menuBarIconFileName = process.platform === 'darwin' ? 'menubarTemplate@2x.png' : 'menubar@2x.png'

const joinPath = (...paths: (string | undefined)[]) => {
  const pathArray = paths.filter((it) => !!it) as string[]
  return path.normalize(path.join(...pathArray))
}

const INDEX_JS_FOLDER = path.normalize(__dirname)

const userDataPath = (...subpath: (string | undefined)[]) => {
  // c:/users/jane/AppData/Roaming/aicodiny
  return joinPath(app.getPath('userData'), ...subpath)
}

export class PathHelper {
  // index.js가 있는 폴더이다
  static indexJsPath = () => {
    // DEV: d:/p2/codiny/aicoding-hw/.webpack/main/index.js
    // c:/users/jane/AppData/Local/aicodiny_hw/app-1.0.0/resource/app/.webpack/main/index.js
    return INDEX_JS_FOLDER
  }

  static appPath = (...subpath: (string | undefined)[]) => {
    // DEV: d:/p2/codiny/aicoding-hw
    // PROD: c:/users/jane/AppData/Local/aicodiny_hw/app-1.0.0/resource/app
    return joinPath(app.getAppPath(), ...subpath)
  }

  /**
   * 웹페이지 루트 경로
   */
  static webRootPath = (...subpath: (string | undefined)[]): string => {
    return PathHelper.appPath('.webpack/renderer/main_window', ...subpath)
  }

  /**
   * 빌드 리소스 경로
   */
  static buildResourcesPath = (...subpath: (string | undefined)[]): string => {
    return PathHelper.appPath('.webpack/build-resources', ...subpath)
  }

  /**
   * 드라이버 파일 경로
   */
  static driversPath = (...subpath: (string | undefined)[]): string => {
    return PathHelper.webRootPath('drivers', ...subpath)
  }

  /**
   * 펌웨어 파일 경로
   */
  static firmwaresPath = (...subpath: (string | undefined)[]): string => {
    return PathHelper.webRootPath('firmwares', ...subpath)
  }

  /**
   * 사용자 설정 경로
   */
  static settingsPath = (): string => {
    if (isDevelopmentOrTest) {
      return PathHelper.appPath('settings')
    } else {
      return joinPath(app.getPath('userData'), 'settings')
    }
  }

  /**
   * 임시 폴더
   */
  static tempPath = (...subpath: (string | undefined)[]): string => {
    return joinPath(app.getPath('temp'), 'aicodiny', ...subpath)
  }

  /**
   * 로그 경로
   */
  static logPath = (...subpath: (string | undefined)[]): string => {
    return joinPath(app.getPath('logs'), ...subpath)
  }

  /**
   * 메뉴바 아이콘 경로
   */
  static menubarIconPath = (): string => {
    if (isDevelopmentOrTest) {
      return PathHelper.buildResourcesPath(menuBarIconFileName)
    } else {
      return joinPath(process.resourcesPath, menuBarIconFileName)
    }
  }

  /**
   * 유틸리티를 설치하는 경로
   */
  static toolsPath = (...subpath: (string | undefined)[]): string => {
    return userDataPath('tools', ...subpath)
  }
}

console.log({
  rootFolder: PathHelper.indexJsPath(),
  appPath: PathHelper.appPath(),
  webRoot: PathHelper.webRootPath(),
  buildResFolder: PathHelper.buildResourcesPath(),
  driversPath: PathHelper.driversPath(),
  logPath: PathHelper.logPath(),
  MAIN_WINDOW_WEBPACK_ENTRY: MAIN_WINDOW_WEBPACK_ENTRY,
  MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
})
