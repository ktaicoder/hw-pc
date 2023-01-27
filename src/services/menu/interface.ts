import { MenuItemConstructorOptions } from 'electron'
import { MenuChannel } from 'src/constants/channels'
import { ProxyPropertyType } from 'src/electron-ipc-cat/common'

export interface DeferredMenuItemConstructorOptions
  extends Omit<MenuItemConstructorOptions, 'label' | 'enabled' | 'checked' | 'submenu'> {
  checked?: (() => boolean) | (() => Promise<boolean>) | boolean
  enabled?: (() => boolean) | (() => Promise<boolean>) | boolean
  label?: (() => string) | string
  submenu?: Array<MenuItemConstructorOptions | DeferredMenuItemConstructorOptions>
}

export interface IMenuService {
  buildMenu(): Promise<void>
  insertMenu(
    menuID: string,
    menuItems: DeferredMenuItemConstructorOptions[],
    afterSubMenu?: string | null,
    withSeparator?: boolean,
    menuPartKey?: string,
  ): Promise<void>
}

export const MenuServiceIPCDescriptor = {
  channel: MenuChannel.name,
  properties: {
    buildMenu: ProxyPropertyType.Function,
    insertMenu: ProxyPropertyType.Function,
  },
}
