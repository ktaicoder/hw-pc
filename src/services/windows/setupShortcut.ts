import { BrowserWindow, globalShortcut } from 'electron'
import localShortcut from 'electron-localshortcut'
import { zoomIn, zoomOut } from '../libs/zoom'

export const setupShortcut = (mainWindow: BrowserWindow) => {
  localShortcut.register(mainWindow, 'F12', () => {
    mainWindow.webContents.toggleDevTools()
  })

  localShortcut.register(mainWindow, ['CmdOrCtrl+R', 'F5'], () => {
    mainWindow.reload()
  })

  localShortcut.register(mainWindow, 'F11', () => {
    mainWindow.setFullScreen(!mainWindow.fullScreen)
  })

  const zoomInWrapper = () => zoomIn(mainWindow)
  const zoomOutWrapper = () => zoomOut(mainWindow)

  //localShortcut.register(mainWindow, ['CmdOrCtrl+Plus', 'Ctrl+numadd'], zoomIn)
  //localShortcut.register(mainWindow, ['CmdOrCtrl+numsub'], zoomOut)
  globalShortcut.register('CmdOrCtrl+Plus', zoomInWrapper)
  globalShortcut.register('CmdOrCtrl+numadd', zoomInWrapper)
  globalShortcut.register('CmdOrCtrl+-', zoomOutWrapper)
  globalShortcut.register('CmdOrCtrl+numsub', zoomOutWrapper)
}
