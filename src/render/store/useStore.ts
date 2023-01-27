import { MobXProviderContext } from 'mobx-react'
import { useContext } from 'react'
import RootStore from './RootStore'

/**
 * Mobx store hook
 */
export default function useStore(): RootStore {
  const context = useContext(MobXProviderContext)
  if (context === undefined) {
    throw new Error('useStore must be used within StoreProvider')
  }

  return context as RootStore
}
