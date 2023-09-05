import { enableStaticRendering, Provider } from 'mobx-react'
import { RootStore } from './RootStore'

// eslint-disable-next-line react-hooks/rules-of-hooks
enableStaticRendering(typeof window === 'undefined')

/**
 * 루트 스토어
 */
let rootStore: RootStore | undefined

type Props = {
  children: React.ReactNode
}

/**
 * Mobx 스토어 프로바이더
 */
export function StoreProvider(props: Props) {
  const { children } = props
  const store = initializeStore()

  return <Provider {...store.allStores}>{children}</Provider>
}

/**
 * RootStore 초기화
 */
function initializeStore(): RootStore {
  const _store = rootStore ?? new RootStore()

  if (!rootStore) rootStore = _store

  return _store
}
