import { useEffect, useState } from 'react'
import { HwServerState } from './interface'

export function useHwServerState(): HwServerState | undefined {
    const [hwServerState, setHwServerState] = useState<HwServerState | undefined>()
    useEffect(() => {
        const s1 = window.observables.hw.hwServerState$.subscribe((stat) => {
            console.log('useHwServerState()', stat)
            setHwServerState(stat)
        })
        return () => {
            s1.unsubscribe()
        }
    }, [])

    return hwServerState
}
