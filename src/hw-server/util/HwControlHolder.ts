import { HwControlFactoryFn, IHwControl } from 'src/custom-types'

export class HwControlHolder {
    private _controls: Record<string, IHwControl> = {}
    constructor() {}

    getOrNull = (hwId: string): IHwControl | null => {
        return this._controls[hwId] ?? null
    }

    create = (hwId: string, controlFactoryFn: HwControlFactoryFn): IHwControl => {
        let control = this._controls[hwId]
        if (control) {
            throw new Error('already exists hwId:' + hwId)
        }
        control = controlFactoryFn()
        this._controls[hwId] = control
        return control
    }

    remove = (hwId: string) => {
        delete this._controls[hwId]
    }

    removeAll = () => {
        this._controls = {}
    }

    getHwIdList = (): string[] => {
        return Object.keys(this._controls)
    }
}
