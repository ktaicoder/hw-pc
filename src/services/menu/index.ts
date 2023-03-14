import { app, Menu, shell, MenuItemConstructorOptions } from 'electron'
import { injectable } from 'inversify'
import { compact, debounce, drop, remove, take } from 'lodash'
import { lazyInject } from 'src/services/container'
import { logger } from 'src/services/libs/log'
import type { IPreferencesService } from 'src/services/preferences/interface'
import serviceIdentifier from 'src/services/serviceIdentifier'
import type { IWindowService } from 'src/services/windows/interface'
import { WindowNames } from 'src/services/windows/WindowProperties'
import { InsertMenuAfterSubMenuIndexError } from './error'
import type { IMenuService } from './interface'
import { DeferredMenuItemConstructorOptions } from './interface'

const isMac = process.platform === 'darwin'

@injectable()
export class MenuService implements IMenuService {
  @lazyInject(serviceIdentifier.Preferences) private readonly preferenceService!: IPreferencesService
  @lazyInject(serviceIdentifier.Window) private readonly windowService!: IWindowService

  private _menuTemplate?: DeferredMenuItemConstructorOptions[]
  /**
   * Record each menu part contains what menuItem, so we can delete these menuItem before insert new ones
   * `{ [menuPartKey]: [menuID, menuItemID][] }`
   * Menu part means "refresh part", that will be refresh upon insert new items.
   */
  private menuPartRecord: Record<string, Array<[string, string]>> = {}

  private get menuTemplate(): DeferredMenuItemConstructorOptions[] {
    if (this._menuTemplate === undefined) {
      this.loadDefaultMenuTemplate()
    }
    return this._menuTemplate!
  }

  constructor() {
    this.buildMenu = debounce(this.buildMenu.bind(this), 50) as () => Promise<void>
  }

  /** check if menuItem with menuID and itemID belongs to a menuPartKey */
  private belongsToPart(menuPartKey: string, menuID: string, itemID?: string): boolean {
    // if menuItem only have role, it won't be refresh, so it won't belongs to a refresh part
    if (itemID === undefined) {
      return false
    }
    const record = this.menuPartRecord[menuPartKey]
    if (record !== undefined) {
      return record.some(([currentMenuID, currentItemID]) => menuID === currentMenuID && itemID === currentItemID)
    }
    return false
  }

  private updateMenuPartRecord(
    menuPartKey: string,
    menuID: string,
    newSubMenuItems: Array<DeferredMenuItemConstructorOptions | MenuItemConstructorOptions>,
  ): void {
    this.menuPartRecord[menuPartKey] = newSubMenuItems
      .filter((item) => item.id !== undefined)
      .map((item) => [menuID, item.id!] as [string, string])
  }

  /**
   * Rebuild or create menubar from the latest menu template, will be call after some method change the menuTemplate
   * You don't need to call this after calling method like insertMenu, it will be call automatically.
   */
  public async buildMenu() {
    const latestTemplate = (await this.getCurrentMenuItemConstructorOptions(this.menuTemplate)) ?? []
    try {
      const menu = Menu.buildFromTemplate(latestTemplate)
      Menu.setApplicationMenu(menu)
    } catch (error) {
      logger.error(
        `buildMenu() failed: ${(error as Error).message} ${(error as Error).stack ?? ''}\n${JSON.stringify(
          latestTemplate,
        )}`,
      )
    }
  }

  /**
   * We have some value in template that need to get latest value, they are functions, we execute every functions in the template
   * @param submenu menu options to get latest value
   * @returns MenuTemplate that `Menu.buildFromTemplate` wants
   */
  private async getCurrentMenuItemConstructorOptions(
    submenu?: Array<DeferredMenuItemConstructorOptions | MenuItemConstructorOptions>,
  ): Promise<MenuItemConstructorOptions[] | undefined> {
    if (submenu === undefined) return
    return Promise.all(
      submenu.map(async (item) => ({
        ...item,
        /** label sometimes is null, causing  */
        label: typeof item.label === 'function' ? item.label() ?? undefined : item.label,
        checked: typeof item.checked === 'function' ? await item.checked() : item.checked,
        enabled: typeof item.enabled === 'function' ? await item.enabled() : item.enabled,
        submenu: !Array.isArray(item.submenu)
          ? item.submenu
          : await this.getCurrentMenuItemConstructorOptions(compact(item.submenu)),
      })),
    )
  }

  private loadDefaultMenuTemplate(): void {
    this._menuTemplate = [
      {
        label: () => app.name,
        id: app.name,
        submenu: [
          {
            label: () => 'About',
            click: () => this.windowService.open(WindowNames.about),
          },
          { type: 'separator' },
          // {
          //     label: () => 'ContextMenu.CheckForUpdates',
          //     click: () => ipcMain.emit('request-check-for-updates'),
          // },
          {
            label: () => 'Settings',
            accelerator: 'CmdOrCtrl+,',
            click: () => this.windowService.open(WindowNames.preferences),
          },
          // { type: 'separator' },
          // { role: 'services', submenu: [] },
          { type: 'separator' },
          // { role: 'hide' },
          // { role: 'hideOthers' },
          // { role: 'unhide' },
          isMac ? { role: 'close' } : { role: 'quit' },
        ],
      },
      {
        label: () => 'Help',
        role: 'help',
        id: 'help',
        submenu: [
          {
            label: () => 'LearnMore',
            click: () => shell.openExternal('https://github.com/ktaicoder/hw-pc'),
          },
        ],
      },
    ]
  }

  private static isMenuItemEqual<T extends DeferredMenuItemConstructorOptions | MenuItemConstructorOptions>(
    a: T,
    b: T,
  ): boolean {
    if (a.id === b.id && a.id !== undefined) {
      return true
    }
    if (a.role === b.role && a.role !== undefined) {
      return true
    }
    if (typeof a.label === 'string' && typeof b.label === 'string' && a.label === b.label && a.label !== undefined) {
      return true
    }
    if (
      typeof a.label === 'function' &&
      typeof b.label === 'function' &&
      a.label() === b.label() &&
      a.label() !== undefined
    ) {
      return true
    }
    if (
      typeof a.label === 'function' &&
      typeof b.label === 'string' &&
      a.label() === b.label &&
      b.label !== undefined
    ) {
      return true
    }
    if (
      typeof b.label === 'function' &&
      typeof a.label === 'string' &&
      b.label() === a.label &&
      a.label !== undefined
    ) {
      return true
    }
    return false
  }

  /**
   * Insert provided sub menu items into menubar, so user and services can register custom menu items
   * @param menuID Top level menu name to insert menu items
   * @param newSubMenuItems An array of menu item to insert or update, if some of item is already existed, it will be updated instead of inserted
   * @param afterSubMenu The `id` or `role` of a submenu you want your submenu insert after. `null` means inserted as first submenu item; `undefined` means inserted as last submenu item;
   * @param withSeparator Need to insert a separator first, before insert menu items
   * @param menuPartKey When you update a part of menu, you can overwrite old menu part with same key
   */
  public async insertMenu(
    menuID: string,
    newSubMenuItems: Array<DeferredMenuItemConstructorOptions | MenuItemConstructorOptions>,
    afterSubMenu?: string | null,
    withSeparator = false,
    menuPartKey?: string,
  ): Promise<void> {
    let foundMenuName = false
    const copyOfNewSubMenuItems = [...newSubMenuItems]
    // try insert menu into an existed menu's submenu
    for (const menu of this.menuTemplate) {
      // match top level menu
      if (menu.id === menuID) {
        foundMenuName = true
        // heck some menu item existed, we update them and pop them out
        const currentSubMenu = compact(menu.submenu)
        // we push old and new content into this array, and assign back to menu.submenu later
        let filteredSubMenu: Array<DeferredMenuItemConstructorOptions | MenuItemConstructorOptions> = currentSubMenu
        // refresh menu part by delete previous menuItems that belongs to the same partKey
        if (menuPartKey !== undefined) {
          filteredSubMenu = filteredSubMenu.filter(
            (currentSubMenuItem) => !this.belongsToPart(menuPartKey, menuID, currentSubMenuItem.id),
          )
        }
        for (const newSubMenuItem of newSubMenuItems) {
          const existedItemIndex = currentSubMenu.findIndex((existedItem) =>
            MenuService.isMenuItemEqual(existedItem, newSubMenuItem),
          )
          // replace existed item, and remove it from needed-to-add-items
          if (existedItemIndex !== -1) {
            filteredSubMenu[existedItemIndex] = newSubMenuItem
            remove(newSubMenuItems, (item) => item.id === newSubMenuItem.id)
          }
        }

        if (afterSubMenu === undefined) {
          // inserted as last submenu item
          if (withSeparator) {
            filteredSubMenu.push({ type: 'separator' })
          }
          filteredSubMenu = [...filteredSubMenu, ...newSubMenuItems]
        } else if (afterSubMenu === null) {
          // inserted as first submenu item
          if (withSeparator) {
            newSubMenuItems.push({ type: 'separator' })
          }
          filteredSubMenu = [...newSubMenuItems, ...filteredSubMenu]
        } else if (typeof afterSubMenu === 'string') {
          // insert after afterSubMenu
          const afterSubMenuIndex = filteredSubMenu.findIndex(
            (item) => item.id === afterSubMenu || item.role === afterSubMenu,
          )
          if (afterSubMenuIndex === -1) {
            throw new InsertMenuAfterSubMenuIndexError(afterSubMenu, menuID, menu)
          }
          filteredSubMenu = [
            ...take(filteredSubMenu, afterSubMenuIndex + 1),
            ...newSubMenuItems,
            ...drop(filteredSubMenu, afterSubMenuIndex - 1),
          ]
        }
        menu.submenu = filteredSubMenu
        // leave this finding menu loop
        break
      }
    }
    // if user wants to create a new menu in menubar
    if (!foundMenuName) {
      this.menuTemplate.push({
        label: menuID,
        submenu: newSubMenuItems,
      })
    }
    // update menuPartRecord
    if (menuPartKey !== undefined) {
      this.updateMenuPartRecord(menuPartKey, menuID, copyOfNewSubMenuItems)
    }
    await this.buildMenu()
  }
}
