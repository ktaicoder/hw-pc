import { app } from 'electron'
import process from 'process'
import os from 'os'
import osName from 'os-name'
import { isElectronDevelopment } from 'src/constants/isElectronDevelopment'
import { injectable } from 'inversify'
import { IContextService, IContext, IPaths, IConstants } from './interface'
import * as paths from 'src/constants/paths'
import * as appPaths from 'src/constants/appPaths'
import { getLocalHostUrlWithActualIP } from 'src/services/libs/url'

declare const MAIN_WINDOW_WEBPACK_ENTRY: string

@injectable()
export class ContextService implements IContextService {
  private readonly pathConstants: IPaths = {
    ...paths,
    ...appPaths,
    MAIN_WINDOW_WEBPACK_ENTRY: MAIN_WINDOW_WEBPACK_ENTRY,
  }

  private readonly constants: IConstants = {
    isDevelopment: isElectronDevelopment,
    platform: process.platform,
    appVersion: app.getVersion(),
    appName: app.name,
    osVersion: os.release(),
    osName: osName(),
    osArch: os.arch(),
    osHomeDir: os.homedir(),
    environmentVersions: process.versions,
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
