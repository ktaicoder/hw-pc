import { useEffect, useState } from 'react'
import { HwServerState } from './interface'

export function useHwServerState(): HwServerState | undefined {
    const [hwServerState, setHwServerState] = useState<HwServerState | undefined>()
    useEffect(() => {
        console.log({ window_observables: window.observables })
        const s1 = window.observables.hw.hwServerState$.subscribe(setHwServerState)
        return () => {
            s1.unsubscribe()
        }
    }, [])
    return hwServerState
}
