import { ProxyPropertyType } from 'src/electron-ipc-cat/common'
import { PreferenceChannel } from 'src/constants/channels'
import { BehaviorSubject } from 'rxjs'
import serviceIdentifier from 'src/services/serviceIdentifier'

export interface IPreferencesData {
    downloadPath: string
    language: string
    windowSize?: [number, number]
    useHardwareAcceleration: boolean
    ignoreCertificateErrors: boolean
    favorHwIdList: string[]
}

/**
 * Getter and setter for app business logic preferences.
 */
export interface IPreferencesService {
    get<K extends keyof IPreferencesData>(key: K): Promise<IPreferencesData[K]>
    /**
     * get preferences, may return cached version
     */
    getPreferences: () => Promise<IPreferencesData>

    /** Subscribable stream to get react component updated with latest preferences */
    preferences$: BehaviorSubject<IPreferencesData>

    reset(): Promise<void>
    /**
     * Update preferences, update cache and observable
     */
    set<K extends keyof IPreferencesData>(key: K, value: IPreferencesData[K]): Promise<void>
}

export const PreferenceServiceIPCDescriptor = {
    id: serviceIdentifier.Preferences,
    channel: PreferenceChannel.name,
    properties: {
        preferences$: ProxyPropertyType.Value$,
        set: ProxyPropertyType.Function,
        getPreferences: ProxyPropertyType.Function,
        get: ProxyPropertyType.Function,
        reset: ProxyPropertyType.Function,
    },
}
