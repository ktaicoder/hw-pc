/** Channels controls main thread */
export enum MainChannel {
  /**
   * Common initialization procedural of electron app booting finished, we can do more domain specific jobs
   */
  commonInitFinished = 'common-init-finished',
  windowAllClosed = 'window-all-closed',
}

export enum HwChannel {
  name = 'HwChannel',
}

export enum SerialPortChannel {
  name = 'SerialPortChannel',
}

export enum HidChannel {
  name = 'HidChannel',
}
export enum ContextChannel {
  name = 'ContextChannel',
}

export enum PreferenceChannel {
  name = 'PreferenceChannel',
  getPreference = 'get-preference',
  getPreferences = 'get-preferences',
  update = 'update',
}

export enum WindowChannel {
  name = 'WindowChannel',
  closeFindInPage = 'close-find-in-page',
  openFindInPage = 'open-find-in-page',
  // TODO: add back the listener as https://github.com/webcatalog/neutron/blob/52a35f103761d82ae5a35e5f90fc39024830bc63/src/listeners/index.js#L80
  updateCanGoBack = 'update-can-go-back',
  updateCanGoForward = 'update-can-go-forward',
}

export enum MenuChannel {
  name = 'MenuChannel',
}
export enum NativeChannel {
  name = 'NativeChannel',
}

export enum MetaDataChannel {
  browserViewMetaData = 'browserViewMetaData',
  getViewMetaData = 'getViewMetaData',
  name = 'MetaDataChannel',
}

export type Channels =
  | MainChannel
  | PreferenceChannel
  | ContextChannel
  | WindowChannel
  | MenuChannel
  | NativeChannel
  | MetaDataChannel
