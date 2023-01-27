import { BehaviorSubject, map, Observable } from 'rxjs'
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

export type HwSelection = {
  hwId: string
  info: IHwInfo
  operator: IHwOperator
  control: IHwControl
}

// 전체 하드웨어
const registry: Record<string, HwRegistryData> = Object.values(controls).reduce((acc, cur) => {
  acc[cur.hwId] = {
    hwId: cur.hwId,
    info: cur.info,
    operator: cur.operator,
    controlFactoryFn: cur.control,
  }
  return acc
}, {})

export class HwManager {
  private controlHolder_ = new HwControlHolder()

  private serialPortHolder_ = new HwSerialPortHolder()

  private selection$ = new BehaviorSubject<HwSelection | null>(null)

  constructor() {}

  observeSelection = (): Observable<HwSelection | null> => {
    return this.selection$.asObservable()
  }

  list = (): Array<HwRegistryData> => Object.values(registry)

  hwIds = (): string[] => Object.keys(registry)

  findHw = (hwId: string): HwRegistryData | undefined => registry[hwId]

  findHwControl = (hwId: string): IHwControl | null => {
    return this.controlHolder_.getOrNull(hwId)
  }

  selectHw = (hwId: string): HwSelection | null => {
    const hw = this.findHw(hwId)
    if (!hw) return null
    const { info, operator, controlFactoryFn } = hw

    // 컨트롤을 생성해 둔다
    let control = this.controlHolder_.getOrNull(hwId)
    if (control == null) {
      control = this.controlHolder_.create(hwId, controlFactoryFn)
      console.log('controlHolder create new hw control() for hwId=', hwId)
    } else {
      console.log('controlHolder already exists. hwId=', hwId)
    }
    const selection = { hwId, info, control, operator }
    this.selection$.next(selection)
    return selection
  }

  /**
   * 하드웨어 선택을 취소한다
   * @param hwId 하드웨어ID
   */
  unselectHw = (hwId: string) => {
    this.controlHolder_.remove(hwId)
    this.serialPortHolder_.removeByHwId(hwId)

    const remainHwIds = this.controlHolder_.getHwIdList()
    if (remainHwIds.length > 0) {
      console.log('unselect after, remain hw controls = ', this.controlHolder_.getHwIdList())
    } else {
      console.log('unselect after, no hw controls selected ')
    }
    this.selection$.next(null)
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
    const helper = this.serialPortHolder_.getOrNull(hwId)
    if (!helper) return null
    return helper
  }

  recreateSerialPortHelper = (hwId: string, serialPortPath: string) => {
    this.serialPortHolder_.removeAll()
    this.selectSerialPort(hwId, serialPortPath)
  }

  /**
   * 시리얼포트와 하드웨어를 선택한다.
   * @param hwId 하드웨어 ID
   * @param serialPortPath 시리얼포트 경로, ex) COM1, /dev/ttyUSB0
   * @returns
   */
  selectSerialPort = (hwId: string, serialPortPath: string): SerialPortHelper | null => {
    const { info, control, operator } = this.selectHw(hwId) ?? {}
    if (!info || !control || !operator) {
      console.warn('TODO 하드웨어 not registered', { hwId })
      return null
    }

    let helper = this.serialPortHolder_.getOrNull(hwId)
    if (helper && helper.serialPortPath !== serialPortPath) {
      helper.close()
      helper = null
    }

    if (helper) {
      if (helper.state !== 'first' && helper.state !== 'opened') {
        helper.close()
        helper = null
      }
    }

    if (!helper) {
      helper = this.serialPortHolder_.create(hwId, () => operator.createSerialPortHelper!(serialPortPath))
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
