import { useEffect } from 'react'

/**
 * 마운트할 때 HwServer를 중지한다.
 */
export function useStopHwServerOnMount() {
  useEffect(() => {
    window.service.hw.stopServer()
  }, [])
}
