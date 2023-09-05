import { ProxyPropertyType } from 'src/electron-ipc-cat/common'
import { ContextChannel } from 'src/constants/channels'

export interface IPaths {
  MAIN_WINDOW_WEBPACK_ENTRY: string
  MENUBAR_ICON_PATH: string
  SETTINGS_FOLDER: string
  DRIVER_FOLDER: string
  FIRMWARE_FOLDER: string
  WEB_ROOT_FOLDER: string
  APP_FOLDER: string
  LOG_FOLDER: string
}

/**
 * Available values about running environment
 */
export interface IConstants {
  appName: string
  appVersion: string
  environmentVersions: NodeJS.ProcessVersions
  processResourcePath: string
  isDevelopment: boolean
  osVersion: string
  osName: string
  osArch: string
  osHomeDir: string
  platform: string
  // extra
  appPath: string
  appIsPackaged: boolean
  locale: string | undefined
}

export interface IContext extends IPaths, IConstants {}

/**
 * Manage constant value like `isDevelopment` and many else, so you can know about about running environment in main and renderer process easily.
 */
export interface IContextService {
  get<K extends keyof IContext>(key: K): Promise<IContext[K]>
  getAll(): Promise<IContext>
  getLocalHostUrlWithActualIP(oldUrl: string): Promise<string>
}

export const ContextServiceIPCDescriptor = {
  channel: ContextChannel.name,
  properties: {
    get: ProxyPropertyType.Function,
    getAll: ProxyPropertyType.Function,
    getLocalHostUrlWithActualIP: ProxyPropertyType.Function,
  },
}
