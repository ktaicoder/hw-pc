import { app } from 'electron'
import { IPreferencesData } from './IPreferencesService'

export const defaultPreferences: IPreferencesData = {
  downloadPath: getDefaultDownloadsPath(),
  language: 'ko',
  windowSize: undefined,
  useHardwareAcceleration: true,
  ignoreCertificateErrors: false,
  favorHwIdList: [],
}

function getDefaultDownloadsPath(): string {
  // return path.join(app.getPath('home'), 'Downloads')
  return app.getPath('downloads')
}
