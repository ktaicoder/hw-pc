import { useEffect, useState } from 'react'
import { throttleTime } from 'rxjs'

export function useWebSocketClientCount(): number {
  const [clientCount, setClientCount] = useState(0)

  useEffect(() => {
    const s1 = window.observables.hw.webSocketClientCount$
      .pipe(throttleTime(300, undefined, { leading: true, trailing: true }))
      .subscribe(setClientCount)
    return () => {
      s1.unsubscribe()
    }
  }, [])

  return clientCount
}
