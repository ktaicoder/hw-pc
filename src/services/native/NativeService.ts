import { app, dialog, MessageBoxOptions, shell } from 'electron'
import { injectable } from 'inversify'
import serviceIdentifier from 'src/services/serviceIdentifier'
import type { IWindowService } from 'src/services/windows/IWindowService'
import { WindowNames } from 'src/services/windows/WindowProperties'
import { lazyInject } from '../container'
import { INativeService } from './INativeService'

@injectable()
export class NativeService implements INativeService {
  @lazyInject(serviceIdentifier.Window) private readonly windowService!: IWindowService

  async showElectronMessageBox(
    message: string,
    type: MessageBoxOptions['type'] = 'info',
    windowName = WindowNames.main,
  ): Promise<void> {
    const window = this.windowService.get(windowName)
    if (window) {
      await dialog.showMessageBox(window, { message, type })
    }
  }

  async pickDirectory(defaultPath?: string): Promise<string[]> {
    const dialogResult = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      defaultPath,
    })
    if (!dialogResult.canceled && dialogResult.filePaths.length > 0) {
      return dialogResult.filePaths
    }
    if (dialogResult.canceled && defaultPath !== undefined) {
      return [defaultPath]
    }
    return []
  }

  async pickFile(filters?: Electron.OpenDialogOptions['filters']): Promise<string[]> {
    const dialogResult = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters,
    })
    if (!dialogResult.canceled && dialogResult.filePaths.length > 0) {
      return dialogResult.filePaths
    }
    return []
  }

  async open(uri: string, isDirectory = false): Promise<void> {
    return isDirectory ? shell.showItemInFolder(uri) : shell.openExternal(uri)
  }

  async openUrl(url: string): Promise<void> {
    return shell.openExternal(url)
  }

  async openPath(fpath: string): Promise<void> {
    shell.openPath(fpath)
  }

  async quit(): Promise<void> {
    app.quit()
  }
}
