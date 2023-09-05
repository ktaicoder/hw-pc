import { app } from 'electron'

export const isDevelopment =
  'ELECTRON_IS_DEV' in process.env ? `${process.env.ELECTRON_IS_DEV}` === '1' : !app.isPackaged

export const isTest = process.env.NODE_ENV === 'test'

export const isDevelopmentOrTest = isDevelopment || isTest
