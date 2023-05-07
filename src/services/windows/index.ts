import { app, BrowserWindow, BrowserWindowConstructorOptions } from 'electron'
import windowStateKeeper, { State as windowStateKeeperState } from 'electron-window-state'
import { injectable } from 'inversify'
import path from 'path'
import { MetaDataChannel } from 'src/constants/channels'
import { lazyInject } from 'src/services/container'
import { isTest } from 'src/util/electron-is-development'
import { IMenuService } from '../menu/interface'
import { IPreferencesService } from '../preferences/interface'
import serviceIdentifier from '../serviceIdentifier'
import { IWindowService } from './interface'
import { setupShortcut } from './setupShortcut'
import { setupZoom } from './setupZoom'
import { windowDimension, WindowMeta, WindowNames } from './WindowProperties'

const isMac = process.platform === 'darwin'

@injectable()
export class WindowService implements IWindowService {
  private windows = {} as Partial<Record<WindowNames, BrowserWindow | undefined>>
  private windowMeta = {} as Partial<WindowMeta>
  /** menubar version of main window, if user set openInMenubar to true in preferences */
  // private mainWindowMenuBar?: Menubar

  @lazyInject(serviceIdentifier.Preferences) private readonly preferenceService!: IPreferencesService
  @lazyInject(serviceIdentifier.Menu) private readonly menuService!: IMenuService

  constructor() {
    this.setupMenu()
  }

  /**
   * @override
   */
  public async requestRestart(): Promise<void> {
    app.relaunch()
    app.quit()
  }

  public get(windowName: WindowNames = WindowNames.main): BrowserWindow | undefined {
    // if (windowName === WindowNames.main && this.mainWindowMenuBar?.window !== undefined) {
    //     return this.mainWindowMenuBar.window
    // }
    return this.windows[windowName]
  }

  public async close(windowName: WindowNames): Promise<void> {
    this.get(windowName)?.close()
  }

  public async open<N extends WindowNames>(
    windowName: N,
    meta: WindowMeta[N] = {} as WindowMeta[N],
    recreate?: boolean | ((windowMeta: WindowMeta[N]) => boolean),
  ): Promise<void> {
    const existedWindow = this.get(windowName)
    // update window meta
    await this.setWindowMeta(windowName, meta)
    const existedWindowMeta = await this.getWindowMeta(windowName)
    // const attachToMenubar: boolean = await this.preferenceService.get('attachToMenubar')
    const attachToMenubar = false
    // const titleBar: boolean = await this.preferenceService.get('titleBar')
    const isMainWindow = windowName === WindowNames.main

    // handle existed window, bring existed window to the front and return.
    if (existedWindow !== undefined) {
      if (
        recreate === true ||
        (typeof recreate === 'function' && existedWindowMeta !== undefined && recreate(existedWindowMeta))
      ) {
        existedWindow.close()
      } else {
        return existedWindow.show()
      }
    }

    // create new window
    let mainWindowConfig: Partial<BrowserWindowConstructorOptions> = {}
    let mainWindowState: windowStateKeeperState | undefined
    if (isMainWindow) {
      mainWindowState = windowStateKeeper({
        defaultWidth: windowDimension[WindowNames.main].width,
        defaultHeight: windowDimension[WindowNames.main].height,
      })
      mainWindowConfig = {
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
      }
    }

    const windowConfig: BrowserWindowConstructorOptions = {
      ...windowDimension[windowName],
      ...mainWindowConfig,
      resizable: true,
      maximizable: true,
      minimizable: true,
      fullscreenable: true,
      autoHideMenuBar: false,
      title: 'AI Codiny',
      // titleBarStyle: titleBar ? 'default' : 'hidden',
      // titleBarStyle: titleBar ? 'default' : 'hidden',
      titleBarStyle: 'default',
      // alwaysOnTop: await this.preferenceService.get('alwaysOnTop'),
      alwaysOnTop: false,
      modal: !isMainWindow,
      icon: path.resolve(__dirname, `../build-resources/icons/icon.${isMac ? 'icns' : 'ico'}`),
      webPreferences: {
        devTools: !isTest,
        nodeIntegration: true,
        // webSecurity: !isDevelopmentOrTest,
        webSecurity: false,
        allowRunningInsecureContent: true,
        experimentalFeatures: true,
        defaultEncoding: 'utf-8',
        contextIsolation: true,
        preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
        additionalArguments: [
          `${MetaDataChannel.browserViewMetaData}${windowName}`,
          `${MetaDataChannel.browserViewMetaData}${encodeURIComponent(JSON.stringify(meta))}`,
        ],
      },
      parent: isMainWindow || attachToMenubar ? undefined : this.get(WindowNames.main),
    }
    if (isMainWindow && attachToMenubar) {
      // this.mainWindowMenuBar = await this.handleAttachToMenuBar(windowConfig)
      return
    }

    const newWindow = new BrowserWindow(windowConfig)
    newWindow.setTitle('AI Codiny')
    this.windows[windowName] = newWindow
    if (isMainWindow) {
      mainWindowState?.manage(newWindow)
      this.registerMainWindowListeners(newWindow)
    } else {
      newWindow.setMenuBarVisibility(false)
      // const unregisterContextMenu = await this.menuService.initContextMenuForWindowWebContents(newWindow.webContents)
      newWindow.on('closed', () => {
        delete this.windows[windowName]
        // unregisterContextMenu()
      })
    }

    let webContentLoadingPromise: Promise<void> | undefined
    if (isMainWindow) {
      // handle window show and Webview/browserView show
      webContentLoadingPromise = new Promise<void>((resolve) => {
        newWindow.once('ready-to-show', async () => {
          const mainWindow = this.get(WindowNames.main)
          if (mainWindow === undefined) return
          const { wasOpenedAsHidden } = app.getLoginItemSettings()
          if (!wasOpenedAsHidden) {
            mainWindow.show()
          }
          // calling this to redundantly setBounds BrowserView
          // after the UI is fully loaded
          // if not, BrowserView mouseover event won't work correctly
          // https://github.com/atomery/webcatalog/issues/812
          // await this.workspaceViewService.realignActiveWorkspace()

          // ensure redux is loaded first
          // if not, redux might not be able catch changes sent from ipcMain
          if (!mainWindow.webContents.isLoading()) {
            return resolve()
          }
          mainWindow.webContents.once('did-stop-loading', () => {
            resolve()
          })
        })
      })
    }

    // This loading will wait for a while
    await newWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY)
    await webContentLoadingPromise
  }

  private registerMainWindowListeners(newWindow: BrowserWindow): void {
    setupShortcut(newWindow)
    setupZoom(newWindow)

    // Hide window instead closing on macos
    newWindow.on('close', async (event) => {
      const windowMeta = await this.getWindowMeta(WindowNames.main)
      const mainWindow = this.get(WindowNames.main)
      if (mainWindow === undefined) return
      this.windows[WindowNames.main] = undefined

      if (process.platform === 'darwin' && windowMeta?.forceClose !== true) {
        event.preventDefault()
        // https://github.com/electron/electron/issues/6033#issuecomment-242023295
        if (mainWindow.isFullScreen()) {
          mainWindow.once('leave-full-screen', () => {
            const mainWindow = this.get(WindowNames.main)
            if (mainWindow !== undefined) {
              mainWindow.hide()
            }
          })
          mainWindow.setFullScreen(false)
        } else {
          mainWindow.hide()
        }
      }
    })

    newWindow.on('focus', () => {
      const mainWindow = this.get(WindowNames.main)
      if (mainWindow === undefined) return
      const view = mainWindow?.getBrowserView()
      view?.webContents?.focus()
    })

    newWindow.on('enter-full-screen', () => {
      const mainWindow = this.get(WindowNames.main)
      if (mainWindow === undefined) return
      // mainWindow?.webContents.send('is-fullscreen-updated', true)
      //await this.workspaceViewService.realignActiveWorkspace()
    })

    newWindow.on('leave-full-screen', () => {
      const mainWindow = this.get(WindowNames.main)
      if (mainWindow === undefined) return
      // mainWindow?.webContents.send('is-fullscreen-updated', false)
      // await this.workspaceViewService.realignActiveWorkspace()
    })
  }

  public async isFullScreen(windowName = WindowNames.main): Promise<boolean | undefined> {
    return this.windows[windowName]?.isFullScreen()
  }

  public async setWindowMeta<N extends WindowNames>(windowName: N, meta: WindowMeta[N]): Promise<void> {
    this.windowMeta[windowName] = meta
  }

  public async updateWindowMeta<N extends WindowNames>(windowName: N, meta: WindowMeta[N]): Promise<void> {
    this.windowMeta[windowName] = { ...this.windowMeta[windowName], ...meta }
  }

  public async getWindowMeta<N extends WindowNames>(windowName: N): Promise<WindowMeta[N] | undefined> {
    return this.windowMeta[windowName] as WindowMeta[N]
  }

  public async reload(windowName: WindowNames = WindowNames.main): Promise<void> {
    const win = this.get(windowName)
    win?.getBrowserView()?.webContents?.reload()
  }

  async loadURL(windowName: WindowNames, newUrl: string): Promise<void> {
    const win = this.get(windowName)
    await win?.loadURL(newUrl)
  }

  async setupMenu() {
    this.menuService.buildMenu()
    // await this.menuService.insertMenu('View', [
    //     // { role: 'reload' },
    //     // { role: 'forceReload' },
    //     // `role: 'zoom'` is only supported on macOS
    //     process.platform === 'darwin'
    //         ? {
    //               role: 'zoom',
    //           }
    //         : {
    //               label: 'Zoom',
    //               click: () => {
    //                   this.get(WindowNames.main)?.maximize()
    //               },
    //           },
    //     { role: 'resetZoom' },
    //     { role: 'togglefullscreen' },
    //     { role: 'close' },
    // ])
  }
}
