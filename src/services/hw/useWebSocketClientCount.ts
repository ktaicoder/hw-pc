import { useEffect, useState } from 'react'

export function useWebSocketClientCount(): number {
  const [clientCount, setClientCount] = useState(0)

  useEffect(() => {
    const s1 = window.observables.hw.webSocketClientCount$.subscribe(setClientCount)
    return () => {
      s1.unsubscribe()
    }
  }, [])

  return clientCount
}
