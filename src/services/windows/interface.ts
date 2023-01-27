import { BrowserWindow } from 'electron'
import { WindowChannel } from 'src/constants/channels'
import { ProxyPropertyType } from 'src/electron-ipc-cat/common'
import { WindowMeta, WindowNames } from './WindowProperties'

export interface IWindowService {
  get(windowName: WindowNames): BrowserWindow | undefined
  open<N extends WindowNames>(
    windowName: N,
    meta?: WindowMeta[N],
    recreate?: boolean | ((windowMeta: WindowMeta[N]) => boolean),
  ): Promise<void>
  close(windowName: WindowNames): Promise<void>
  loadURL(windowName: WindowNames, newUrl?: string): Promise<void>

  getWindowMeta<N extends WindowNames>(windowName: N): Promise<WindowMeta[N] | undefined>
  setWindowMeta<N extends WindowNames>(windowName: N, meta?: WindowMeta[N]): Promise<void>
  updateWindowMeta<N extends WindowNames>(windowName: N, meta?: WindowMeta[N]): Promise<void>
}

export const WindowServiceIPCDescriptor = {
  channel: WindowChannel.name,
  properties: {
    get: ProxyPropertyType.Function,
    open: ProxyPropertyType.Function,
    close: ProxyPropertyType.Function,
    setWindowMeta: ProxyPropertyType.Function,
    updateWindowMeta: ProxyPropertyType.Function,
  },
}
