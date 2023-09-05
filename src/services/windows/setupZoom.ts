import { BrowserWindow } from 'electron'
import { zoomIn, zoomOut } from 'src/util/zoom'

export const setupZoom = (mainWindow: BrowserWindow) => {
  mainWindow.webContents.zoomFactor = 1

  // 마우스 스크롤로 줌하는 경우 호출된다
  mainWindow.webContents.on('zoom-changed', (event, zoomDirection) => {
    // logger.debug('zoom-changed', zoomDirection)
    // const currentZoom = mainWindow.webContents.getZoomFactor()
    // logger.debug('Current Zoom Factor - ', currentZoom)
    // logger.debug('Current Zoom Level at - ', mainWindow.webContents.zoomLevel)

    if (zoomDirection === 'in') {
      zoomIn(mainWindow)
    }
    if (zoomDirection === 'out') {
      zoomOut(mainWindow)
    }
  })
}
