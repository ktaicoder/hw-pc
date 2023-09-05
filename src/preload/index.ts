import 'reflect-metadata'
import { contextBridge, ipcRenderer } from 'electron'
import * as service from './common/services'
import { IServicesWithoutObservables, IServicesWithOnlyObservables } from 'src/electron-ipc-cat/common'
import { IPossibleWindowMeta } from 'src/services/windows/WindowProperties'
import { loadBrowserViewMetaData } from './common/browserViewMetaData'
import { MetaDataChannel } from 'src/constants/channels'

const browserViewMetaData = loadBrowserViewMetaData()
contextBridge.exposeInMainWorld('service', service)
contextBridge.exposeInMainWorld('meta', browserViewMetaData)

ipcRenderer.on(MetaDataChannel.getViewMetaData, (event) => {
  event['returnValue'] = browserViewMetaData
})

declare global {
  interface Window {
    meta: IPossibleWindowMeta
    observables: IServicesWithOnlyObservables<typeof service>
    service: IServicesWithoutObservables<typeof service>
  }
}

if (browserViewMetaData.windowName === 'main') {
  // automatically reload page when wifi/network is connected
  // https://www.electronjs.org/docs/tutorial/online-offline-events
  const handleOnlineOffline = (): void => {
    // ipcRenderer.invoke(ViewChannel.onlineStatusChanged, window.navigator.onLine)
  }
  window.addEventListener('online', handleOnlineOffline)
  window.addEventListener('offline', handleOnlineOffline)
}
