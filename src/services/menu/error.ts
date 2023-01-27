import { DeferredMenuItemConstructorOptions } from './interface'

export class InsertMenuAfterSubMenuIndexError extends Error {
  constructor(afterSubMenu: string, menuID: string, menu: DeferredMenuItemConstructorOptions) {
    super()
    this.name = 'Error.InsertMenuAfterSubMenuIndexError'
    this.message = 'Error.InsertMenuAfterSubMenuIndexErrorDescription'
  }
}
