import { app } from 'electron'
import path from 'path'
import { IPreferencesData } from './interface'

export const defaultPreferences: IPreferencesData = {
    downloadPath: getDefaultDownloadsPath(),
    language: 'ko',
    windowSize: undefined,
    useHardwareAcceleration: true,
    ignoreCertificateErrors: false,
    favorHwIdList: [],
}

function getDefaultDownloadsPath(): string {
    return path.join(app.getPath('home'), 'Downloads')
}
