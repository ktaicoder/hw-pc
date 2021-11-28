import { HwControlFactoryFn, IHwControl, SerialPortHelper } from 'src/custom-types'

export class HwSerialPortHolder {
    private _helpers: Record<string, SerialPortHelper> = {}
    constructor() {}

    getOrNull = (hwId: string): SerialPortHelper | null => {
        return this._helpers[hwId] ?? null
    }

    create = (hwId: string, factoryFn: () => SerialPortHelper) => {
        let helper = this._helpers[hwId]
        if (helper) {
            throw new Error('already exists serialport:' + hwId)
        }
        helper = factoryFn()
        this._helpers[hwId] = helper
        return helper
    }

    removeByHwId = (hwId: string) => {
        const helper = this._helpers[hwId]
        if (helper) {
            helper.close()
            delete this._helpers[hwId]
        }
    }
}
