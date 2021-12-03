import path from 'path'
import { isDevelopmentOrTest } from './environment'
import { rootFolder } from './paths'

export const SETTINGS_FOLDER = isDevelopmentOrTest
    ? path.resolve(rootFolder, '..', 'settings-dev')
    : path.resolve(require('electron').app.getPath('userData'), 'settings')

export const LAUNCH_SCHEMA = 'ktaicodingblock-hw'
