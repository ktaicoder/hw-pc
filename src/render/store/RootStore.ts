import SidebarStore from './sub-stores/SidebarStore'

/**
 * Mobx 루트 스토어
 */
class RootStore {
  sidebarStore = new SidebarStore()

  allStores = {
    sidebarStore: this.sidebarStore,
  }
}

export default RootStore
