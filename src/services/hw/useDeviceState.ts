import { UiDeviceState } from 'src/custom-types/basic-types'
import { useEffect, useState } from 'react'

export function useDeviceState(): UiDeviceState {
  const [deviceState, setDeviceState] = useState<UiDeviceState>({
    txBytes: 0,
    txTimestamp: 0,
    rxBytes: 0,
    rxTimestamp: 0,
  })

  useEffect(() => {
    const s1 = window.observables.hw.deviceState$.subscribe(setDeviceState)
    return () => {
      s1.unsubscribe()
    }
  }, [])

  return deviceState
}
