import settings from 'electron-settings'
import { injectable } from 'inversify'
import { BehaviorSubject } from 'rxjs'
import { defaultPreferences } from './defaultPreferences'
import { IPreferencesData, IPreferencesService } from './IPreferencesService'

@injectable()
export class PreferencesService implements IPreferencesService {
  /**
   * @override
   */
  public preferences$ = new BehaviorSubject<IPreferencesData>(defaultPreferences)

  private _initialized = false
  /**
   * load preferences in sync, and ensure it is an Object
   */
  private readonly _init = () => {
    if (this._initialized) {
      return
    }
    this._initialized
    const preferencesFromDisk = settings.getSync('preferences')
    if (!preferencesFromDisk) {
      // use default
      return
    }

    if (typeof preferencesFromDisk === 'object' && !Array.isArray(preferencesFromDisk)) {
      this.preferences$.next(preferencesFromDisk as unknown as IPreferencesData)
    }
  }

  public async set<K extends keyof IPreferencesData>(
    key: K,
    value: IPreferencesData[K],
  ): Promise<void> {
    this._init()
    const pref = { ...this.preferences$.value }
    pref[key] = value
    await settings.set(`preferences.${key}`, value ?? '')
    this.preferences$.next(pref)
  }

  public getPreferences = async (): Promise<IPreferencesData> => {
    this._init()
    return this.preferences$.value
  }

  public async get<K extends keyof IPreferencesData>(key: K): Promise<IPreferencesData[K]> {
    this._init()
    const pref = this.preferences$.value
    return pref[key]
  }

  public async reset(): Promise<void> {
    await settings.unset()
    const pref = { ...defaultPreferences }
    await settings.set('preferences', { ...pref })
    this.preferences$.next(pref)
  }
}
