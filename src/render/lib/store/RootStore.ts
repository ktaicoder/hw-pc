import { SidebarStore } from './sub-stores/SidebarStore'

/**
 * Mobx 루트 스토어
 */
export class RootStore {
  sidebarStore = new SidebarStore()

  allStores = {
    sidebarStore: this.sidebarStore,
  }
}
