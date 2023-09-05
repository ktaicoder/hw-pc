import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { filter, take } from 'rxjs'

/**
 * navigate back if current hw unselected
 */
export function useMoveBackWhenUnselected(hwId: string) {
  const navigate = useNavigate()
  useEffect(() => {
    const s1 = window.observables.hw.hwServerState$
      .pipe(
        filter((stat) => stat.hwId !== hwId),
        take(1),
      )
      .subscribe(() => {
        navigate('/')
      })

    return () => {
      s1.unsubscribe()
    }
  }, [navigate, hwId])
}
