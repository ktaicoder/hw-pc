import { Subscription } from 'rxjs'
import { SerialPortHelper } from 'src/custom-types'

export class HwSerialPortHolder {
    private _helpers: Record<string, SerialPortHelper> = {}
    private _subscriptions: Record<string, Subscription> = {}

    constructor() {}

    getOrNull = (hwId: string): SerialPortHelper | null => {
        return this._helpers[hwId] ?? null
    }

    create = (hwId: string, factoryFn: () => SerialPortHelper) => {
        let helper = this._helpers[hwId]
        if (helper) {
            throw new Error('already exists serialport:' + hwId)
        }

        this._subscriptions[hwId]?.unsubscribe()

        helper = factoryFn()
        this._helpers[hwId] = helper
        this._subscriptions[hwId] = helper.observeState().subscribe((state) => {
            console.log('HwSerialPortHolder seriaport state changed:' + state)
            if (state !== 'first' && state !== 'opened') {
                const mgr = this
                setTimeout(() => {
                    console.log('HwSerialPortHolder auto remove serialportHelper:' + hwId)
                    mgr.removeByHwId(hwId)
                }, 0)
            }
        })

        return helper
    }

    removeByHwId = (hwId: string) => {
        const helper = this._helpers[hwId]
        if (helper) {
            helper.close()
            delete this._helpers[hwId]
        }
        const subscription = this._subscriptions[hwId]
        if (subscription) {
            subscription.unsubscribe()
            delete this._subscriptions[hwId]
        }
    }

    removeAll = () => {
        Object.values(this._helpers).forEach((helper) => {
            helper.close()
        })
        this._helpers = {}
    }
}
