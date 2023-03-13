import { useEffect, useMemo } from 'react'
import { UiLogManager as UiLogManager } from './UiLogManager'

export function useUiLog(): UiLogManager {
  const messageManager = useMemo(() => new UiLogManager(), [])
  useEffect(() => {
    const s1 = window.observables.hw.consoleMessage$.subscribe((msg) => {
      messageManager.addLine(msg)
    })
    return () => {
      s1.unsubscribe()
    }
  }, [messageManager])

  return messageManager
}
