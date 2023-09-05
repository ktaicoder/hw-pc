import { app } from 'electron'
import { injectable } from 'inversify'
import os from 'os'
import osName from 'os-name'
import { PathHelper } from 'src/PathHelper'
import { isDevelopment } from 'src/util/electron-is-development'
import { getLocalHostUrlWithActualIP } from 'src/util/url'
import { IConstants, IContext, IContextService, IPaths } from './IContextService'

const applicationPaths = [
  'home',
  'appData',
  'userData',
  'sessionData',
  'temp',
  'exe',
  'module',
  'desktop',
  'documents',
  'downloads',
  'music',
  'pictures',
  'videos',
  'recent',
  'logs',
  'crashDumps',
].reduce((acc, cur) => {
  acc[cur] = app.getPath(cur as any)
  return acc
}, {} as Record<string, string>)

@injectable()
export class ContextService implements IContextService {
  private readonly pathConstants: IPaths = {
    MENUBAR_ICON_PATH: PathHelper.menubarIconPath(),
    SETTINGS_FOLDER: PathHelper.settingsPath(),
    DRIVER_FOLDER: PathHelper.driversPath(),
    FIRMWARE_FOLDER: PathHelper.firmwaresPath(),
    WEB_ROOT_FOLDER: PathHelper.webRootPath(),
    APP_FOLDER: PathHelper.appPath(),
    LOG_FOLDER: PathHelper.logPath(),
    MAIN_WINDOW_WEBPACK_ENTRY: MAIN_WINDOW_WEBPACK_ENTRY,
  }

  private readonly constants: IConstants = {
    isDevelopment: isDevelopment,
    platform: process.platform,
    appVersion: app.getVersion(),
    appName: app.name,
    osVersion: os.release(),
    osName: osName(),
    osArch: os.arch(),
    osHomeDir: os.homedir(),
    processResourcePath: process.resourcesPath,
    environmentVersions: process.versions,
    appPath: app.getAppPath(),
    appIsPackaged: app.isPackaged,
    locale: app.getLocale(),
  }

  private readonly context: IContext

  constructor() {
    this.context = {
      ...this.pathConstants,
      ...this.constants,
    }
  }

  public async getAll(): Promise<IContext> {
    return this.context
  }

  public async get<K extends keyof IContext>(key: K): Promise<IContext[K]> {
    if (key in this.context) {
      return this.context[key]
    }

    throw new Error(`${String(key)} not existed in ContextService`)
  }

  public async getLocalHostUrlWithActualIP(oldUrl: string): Promise<string> {
    return getLocalHostUrlWithActualIP(oldUrl)
  }
}
