import * as isDev from 'electron-is-dev'

// export const isElectronDevelopment =
//   !isPackaged && (process.env.NODE_ENV === 'development' || (typeof electron === 'string' || electron.app === undefined ? false : !electron.app.isPackaged));

export const isElectronDevelopment = process.env.NODE_ENV === 'development' || isDev
