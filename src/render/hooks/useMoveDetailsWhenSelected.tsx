import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { filter, map, take } from 'rxjs'

/**
 * navigate details if hw selected
 */
export function useMoveDetailsWhenSelected() {
  const navigate = useNavigate()
  useEffect(() => {
    const s1 = window.observables.hw.hwServerState$
      .pipe(
        map((it) => it.hwId),
        filter((hwId) => !!hwId),
        take(1),
      )
      .subscribe((hwId) => {
        navigate(`/hw/${hwId}`)
      })

    return () => {
      s1.unsubscribe()
    }
  }, [navigate])
}
