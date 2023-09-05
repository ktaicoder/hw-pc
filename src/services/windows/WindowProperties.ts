export enum WindowNames {
  main = 'main',
  // about = 'about',
  // preferences = 'preferences',
}

/**
 * Width height of windows
 */
export const windowDimension: Record<WindowNames, { height?: number; width?: number }> = {
  [WindowNames.main]: {
    width: 1200,
    height: 768,
  },
  // [WindowNames.about]: {
  //   width: 400,
  //   height: 420,
  // },
  // [WindowNames.preferences]: {
  //   width: 600,
  //   height: 620,
  // },
}

export interface WindowMeta {
  [WindowNames.main]: { forceClose?: boolean }
  // [WindowNames.about]: undefined
  // [WindowNames.preferences]: undefined
}

export type IPossibleWindowMeta<M extends WindowMeta[WindowNames] = WindowMeta[WindowNames.main]> =
  {
    windowName: WindowNames
  } & M

/**
 * Similar to WindowMeta, but is for BrowserView (workspace web content) and popup window from the BrowserView
 */
export interface IBrowserViewMetaData {
  isPopup?: boolean
}
