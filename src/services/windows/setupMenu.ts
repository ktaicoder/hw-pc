import { clipboard, ipcMain } from 'electron'
import { MetaDataChannel, WindowChannel } from 'src/constants/channels'
import getFromRenderer from '../libs/getFromRenderer'
import { IMenuService } from '../menu/interface'
import { IPreferencesService } from '../preferences/interface'
import { IBrowserViewMetaData, WindowNames } from './WindowProperties'

export async function setupMenu(menuService: IMenuService): Promise<void> {
    await menuService.insertMenu('View', [
        { role: 'reload' },
        { role: 'forceReload' },
        // `role: 'zoom'` is only supported on macOS
        process.platform === 'darwin'
            ? {
                  role: 'zoom',
              }
            : {
                  label: 'Zoom',
                  click: () => {
                      this.get(WindowNames.main)?.maximize()
                  },
              },
        { role: 'resetZoom' },
        { role: 'togglefullscreen' },
        { role: 'close' },
    ])

    // await menuService.insertMenu(
    //     'View',
    //     [
    //         // {
    //         //     label: () => 'Menu.Find',
    //         //     accelerator: 'CmdOrCtrl+F',
    //         //     click: async () => {
    //         //         const mainWindow = this.get(WindowNames.main)
    //         //         if (mainWindow !== undefined) {
    //         //             mainWindow.webContents.focus()
    //         //             mainWindow.webContents.send(WindowChannel.openFindInPage)
    //         //             const contentSize = mainWindow.getContentSize()
    //         //             const view = mainWindow.getBrowserView()
    //         //             view?.setBounds(await getViewBounds(contentSize as [number, number], true))
    //         //         }
    //         //     },
    //         //     enabled: async () => (await this.workspaceService.countWorkspaces()) > 0,
    //         // },
    //         // {
    //         //     label: () => 'Menu.FindNext',
    //         //     accelerator: 'CmdOrCtrl+G',
    //         //     click: () => {
    //         //         const mainWindow = this.get(WindowNames.main)
    //         //         mainWindow?.webContents?.send('request-back-find-in-page', true)
    //         //     },
    //         //     enabled: async () => (await this.workspaceService.countWorkspaces()) > 0,
    //         // },
    //         // {
    //         //     label: () => 'Menu.FindPrevious',
    //         //     accelerator: 'Shift+CmdOrCtrl+G',
    //         //     click: () => {
    //         //         const mainWindow = this.get(WindowNames.main)
    //         //         mainWindow?.webContents?.send('request-back-find-in-page', false)
    //         //     },
    //         //     enabled: async () => (await this.workspaceService.countWorkspaces()) > 0,
    //         // },
    //         // {
    //         //     label: () => `${'Preference.AlwaysOnTop'} (${'Preference.RequireRestart'})`,
    //         //     checked: async () => await preferencesService.get('alwaysOnTop'),
    //         //     click: async () => {
    //         //         const alwaysOnTop = await preferencesService.get('alwaysOnTop')
    //         //         await preferencesService.set('alwaysOnTop', !alwaysOnTop)
    //         //         await this.requestRestart()
    //         //     },
    //         // },
    //     ],
    //     null,
    //     true,
    // )

    // await menuService.insertMenu('History', [
    //     {
    //         label: () => 'Menu.Home',
    //         accelerator: 'Shift+CmdOrCtrl+H',
    //         click: async () => await this.goHome(),
    //         enabled: async () => (await this.workspaceService.countWorkspaces()) > 0,
    //     },
    //     {
    //         label: () => 'ContextMenu.Back',
    //         accelerator: 'CmdOrCtrl+[',
    //         click: async (_menuItem, browserWindow) => {
    //             // if back is called in popup window
    //             // navigate in the popup window instead
    //             if (browserWindow !== undefined) {
    //                 // TODO: test if we really can get this isPopup value
    //                 const { isPopup } = await getFromRenderer<IBrowserViewMetaData>(
    //                     MetaDataChannel.getViewMetaData,
    //                     browserWindow,
    //                 )
    //                 if (isPopup === true) {
    //                     browserWindow.webContents.goBack()
    //                     return
    //                 }
    //             }
    //             ipcMain.emit('request-go-back')
    //         },
    //         enabled: async () => (await this.workspaceService.countWorkspaces()) > 0,
    //     },
    //     {
    //         label: () => 'ContextMenu.Forward',
    //         accelerator: 'CmdOrCtrl+]',
    //         click: async (_menuItem, browserWindow) => {
    //             // if back is called in popup window
    //             // navigate in the popup window instead
    //             if (browserWindow !== undefined) {
    //                 const { isPopup } = await getFromRenderer<IBrowserViewMetaData>(
    //                     MetaDataChannel.getViewMetaData,
    //                     browserWindow,
    //                 )
    //                 if (isPopup === true) {
    //                     browserWindow.webContents.goBack()
    //                     return
    //                 }
    //             }
    //             ipcMain.emit('request-go-forward')
    //         },
    //         enabled: async () => (await this.workspaceService.countWorkspaces()) > 0,
    //     },
    //     { type: 'separator' },
    //     {
    //         label: () => 'ContextMenu.CopyLink',
    //         accelerator: 'CmdOrCtrl+L',
    //         click: async (_menuItem, browserWindow) => {
    //             // if back is called in popup window
    //             // copy the popup window URL instead
    //             if (browserWindow !== undefined) {
    //                 const { isPopup } = await getFromRenderer<IBrowserViewMetaData>(
    //                     MetaDataChannel.getViewMetaData,
    //                     browserWindow,
    //                 )
    //                 if (isPopup === true) {
    //                     const url = browserWindow.webContents.getURL()
    //                     clipboard.writeText(url)
    //                     return
    //                 }
    //             }
    //             const mainWindow = this.get(WindowNames.main)
    //             const url = mainWindow?.getBrowserView()?.webContents?.getURL()
    //             if (typeof url === 'string') {
    //                 clipboard.writeText(url)
    //             }
    //         },
    //         enabled: async () => (await this.workspaceService.countWorkspaces()) > 0,
    //     },
    // ])
}
