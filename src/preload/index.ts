import { contextBridge, ipcRenderer } from 'electron'
import 'reflect-metadata'
import { MetaDataChannel } from 'src/constants/channels'
import {
  IServicesWithOnlyObservables,
  IServicesWithoutObservables,
} from 'src/electron-ipc-cat/common'
import { IPossibleWindowMeta } from 'src/services/windows/WindowProperties'
import { loadBrowserViewMetaData } from './browserViewMetaData'
import * as service from './services'

const browserViewMetaData = loadBrowserViewMetaData()
contextBridge.exposeInMainWorld('service', service)
contextBridge.exposeInMainWorld('meta', browserViewMetaData)
// window.observables()는 fixContextIsolation()에서 한다

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

// if (browserViewMetaData.windowName === 'main') {
//   // automatically reload page when wifi/network is connected
//   // https://www.electronjs.org/docs/tutorial/online-offline-events
//   const handleOnlineOffline = (): void => {
//     // ipcRenderer.invoke(ViewChannel.onlineStatusChanged, window.navigator.onLine)
//   }
//   window.addEventListener('online', handleOnlineOffline)
//   window.addEventListener('offline', handleOnlineOffline)
// }
