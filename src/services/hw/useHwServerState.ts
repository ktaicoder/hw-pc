import { useEffect, useState } from 'react'
import { HwServerState } from './IHwService'

export function useHwServerState(): HwServerState | undefined {
  const [hwServerState, setHwServerState] = useState<HwServerState | undefined>()
  useEffect(() => {
    const s1 = window.observables.hw.hwServerState$.subscribe(setHwServerState)
    return () => {
      s1.unsubscribe()
    }
  }, [])

  return hwServerState
}
