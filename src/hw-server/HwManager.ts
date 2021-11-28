import { BehaviorSubject, filter, map, Observable } from 'rxjs'
import { controls } from 'src/custom'
import { SerialPortHelper } from 'src/custom-types'
import { HwControlFactoryFn, IHwControl, IHwInfo, IHwOperator } from 'src/custom-types/hw-types'
import { HwControlHolder } from './util/HwControlHolder'
import { HwSerialPortHolder } from './util/HwSerialPortHolder'

type HwRegistryData = {
    hwId: string
    info: IHwInfo
    operator: IHwOperator
    controlFactoryFn: HwControlFactoryFn
}

export class HwManager {
    private _registry$ = new BehaviorSubject<Record<string, HwRegistryData>>({})
    private _controlHolder = new HwControlHolder()
    private _serialPortHolder = new HwSerialPortHolder()

    constructor() {
        // 전체 하드웨어를 등록한다
        Object.entries(controls).forEach(([hwId, hw]) => {
            this.registerHw(hwId, hw.info, hw.operator, hw.control)
        })
    }

    list = (): Array<HwRegistryData> => Object.values(this._registry$.value)

    findHw = (hwId: string): HwRegistryData | undefined => this._registry$.value[hwId]

    observeHwId = (hwId: string): Observable<boolean> => {
        return this._registry$.asObservable().pipe(map((it) => (it[hwId] ? true : false)))
    }

    observeHwIds = (): Observable<string[]> => {
        return this._registry$.asObservable().pipe(map((it) => Object.keys(it)))
    }

    registerHw = (hwId: string, info: IHwInfo, operator: IHwOperator, controlFactoryFn: HwControlFactoryFn) => {
        console.log('registerHw()', { hwId, hwName: info.hwName })
        const reg = { ...this._registry$.value }
        reg[hwId] = {
            hwId,
            info: info,
            operator,
            controlFactoryFn,
        }
        this._registry$.next(reg)
    }

    findHwControl = (hwId: string): IHwControl | null => {
        return this._controlHolder.getOrNull(hwId)
    }

    selectHw = (hwId: string): { operator: IHwOperator; control: IHwControl } | null => {
        const { operator, controlFactoryFn } = this.findHw(hwId) ?? {}
        if (!operator || !controlFactoryFn) {
            return null
        }

        // 컨트롤을 생성해 둔다
        let control = this._controlHolder.getOrNull(hwId)
        if (control == null) {
            control = this._controlHolder.create(hwId, controlFactoryFn)
            console.log('controlHolder create new hw control() for hwId=', hwId)
        } else {
            console.log('controlHolder already exists. hwId=', hwId)
        }

        return { control, operator }
    }

    /**
     * 하드웨어 선택을 취소한다
     * @param hwId 하드웨어ID
     */
    unselectHw = (hwId: string) => {
        this._controlHolder.remove(hwId)
        this._serialPortHolder.removeByHwId(hwId)

        const remainHwIds = this._controlHolder.getHwIdList()
        if (remainHwIds.length > 0) {
            console.log('unselect after, remain hw controls = ', this._controlHolder.getHwIdList())
        } else {
            console.log('unselect after, no hw controls selected ')
        }
    }

    isRegisteredHw = (hwId: string): boolean => {
        return this.findHw(hwId) ? true : false
    }

    isRegisteredSerialPort = (hwId: string, serialPortPath: string): boolean => {
        const helper = this.getSerialPortHelperOrNull(hwId)
        if (!helper) return false
        return helper.serialPortPath === serialPortPath
    }

    getSerialPortHelperOrNull = (hwId: string) => {
        if (!this.isRegisteredHw(hwId)) return null
        const helper = this._serialPortHolder.getOrNull(hwId)
        if (!helper) return null
        return helper
    }

    /**
     * 시리얼포트와 하드웨어를 선택한다.
     * @param hwId 하드웨어 ID
     * @param serialPortPath 시리얼포트 경로, ex) COM1, /dev/ttyUSB0
     * @returns
     */
    selectSerialPort = (hwId: string, serialPortPath: string): SerialPortHelper | null => {
        const { control, operator } = this.selectHw(hwId) ?? {}
        if (!control || !operator) {
            console.warn('TODO 하드웨어 not registered', { hwId })
            return null
        }

        let helper = this._serialPortHolder.getOrNull(hwId)
        if (helper && helper.serialPortPath !== serialPortPath) {
            helper.close()
            helper = null
        }

        if (!helper) {
            helper = this._serialPortHolder.create(hwId, () => operator.createSerialPortHelper!(serialPortPath))
        }

        if (!helper) {
            throw new Error('cannot create serialport:' + JSON.stringify({ hwId, serialPortPath }))
        }
        helper.open()

        control.setContext({
            provideSerialPortHelper: () => helper!,
        })
        return helper
    }
}
