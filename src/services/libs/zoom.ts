import { BrowserWindow } from 'electron'
import { logger } from './log'

const DEBUG = false
const ZOOM_MAX = 1.5
const ZOOM_MIN = 0.7
const ZOOM_STEP = 0.1

export const zoomIn = (mainWindow: BrowserWindow) => {
  const currentZoom = mainWindow.webContents.getZoomFactor()
  mainWindow.webContents.zoomFactor = Math.min(currentZoom + ZOOM_STEP, ZOOM_MAX)
  if (DEBUG) logger.debug(`Zoom Factor Increased to ${(mainWindow.webContents.zoomFactor * 100).toFixed(1)}%`)
}

export const zoomOut = (mainWindow: BrowserWindow) => {
  const currentZoom = mainWindow.webContents.getZoomFactor()
  mainWindow.webContents.zoomFactor = Math.max(currentZoom - ZOOM_STEP, ZOOM_MIN)
  if (DEBUG) logger.debug(`Zoom Factor Decreased to ${(mainWindow.webContents.zoomFactor * 100).toFixed(1)}%`)
}
