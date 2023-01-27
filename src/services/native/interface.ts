import { MessageBoxOptions } from 'electron'
import { Observable } from 'rxjs'

import { ProxyPropertyType } from 'src/electron-ipc-cat/common'
import { NativeChannel } from 'src/constants/channels'
import { WindowNames } from 'src/services/windows/WindowProperties'

/**
 * Wrap call to electron api, so we won't need remote module in renderer process
 */
export interface INativeService {
  open(uri: string, isDirectory?: boolean): Promise<void>
  openUrl(url: string): Promise<void>
  openPath(fpath: string): Promise<void>
  pickDirectory(defaultPath?: string): Promise<string[]>
  pickFile(filters?: Electron.OpenDialogOptions['filters']): Promise<string[]>
  quit(): void
  showElectronMessageBox(message: string, type: MessageBoxOptions['type'], WindowName?: WindowNames): Promise<void>
}
export const NativeServiceIPCDescriptor = {
  channel: NativeChannel.name,
  properties: {
    open: ProxyPropertyType.Function,
    openUrl: ProxyPropertyType.Function,
    openPath: ProxyPropertyType.Function,
    pickDirectory: ProxyPropertyType.Function,
    pickFile: ProxyPropertyType.Function,
    quit: ProxyPropertyType.Function,
    showElectronMessageBox: ProxyPropertyType.Function,
  },
}
