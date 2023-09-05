import { useEffect, useState } from 'react'
import { IPreferencesData } from './IPreferencesService'

export function usePreference(): IPreferencesData | undefined {
  const [preferences, setPreferences] = useState<IPreferencesData | undefined>()
  useEffect(() => {
    //  console.log({ window_observables: window.observables })
    const s1 = window.observables.preferences.preferences$.subscribe(setPreferences)
    return () => {
      s1.unsubscribe()
    }
  }, [])
  return preferences
}
