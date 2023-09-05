import { useUnmount } from 'react-use'

/**
 * 언마운트할 때 HwServer를 중지한다.
 */
export function useStopHwServerOnUnmount() {
  useUnmount(() => {
    window.service.hw.stopServer()
  })
}
