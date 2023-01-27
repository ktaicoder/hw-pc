import { shell } from 'electron'
import { injectable } from 'inversify'
import path from 'path'
import { BehaviorSubject, debounceTime, Subscription } from 'rxjs'
import SerialPort from 'serialport'
import { IHwInfo } from 'src/custom-types'
import { HwManager } from 'src/hw-server/HwManager'
import { HwServer } from 'src/hw-server/HwServer'
import { lazyInject } from 'src/services/container'
import { IContextService } from '../context/interface'
import { ISerialPortService } from '../serialport/interface'
import serviceIdentifier from '../serviceIdentifier'
import { HwServerState, IHwService } from './interface'

@injectable()
export class HwService implements IHwService {
  @lazyInject(serviceIdentifier.Context) private readonly contextService!: IContextService
  @lazyInject(serviceIdentifier.SerialPort) private readonly serialPortService!: ISerialPortService

  /**
   * @override
   */
  public hwServerState$ = new BehaviorSubject<HwServerState>({ running: false, hwId: undefined })
  private hwServer_: HwServer
  private hwManager_: HwManager
  private hwServerSubscription_?: Subscription | null = null

  constructor() {
    this.hwManager_ = new HwManager()
    this.hwServer_ = new HwServer(this.hwManager_)
    const subscription = this.hwServer_.observeRunning().subscribe((running) => {
      this.hwServerState$.next({ ...this.hwServerState$.value, running })
    })

    subscription.add(
      this.hwManager_
        .observeSelection()
        .pipe(debounceTime(100))
        .subscribe((selectedHw) => {
          if (selectedHw) {
            this.hwServer_.start()
          } else {
            this.hwServer_.stop()
          }
          this.hwServerState$.next({ ...this.hwServerState$.value, hwId: selectedHw?.hwId })
        }),
    )

    this.hwServerSubscription_ = subscription
    // this.hwServer_.start()
  }

  async getHwServerState(): Promise<HwServerState> {
    return this.hwServerState$.value
  }

  async infoList(): Promise<IHwInfo[]> {
    try {
      return this.hwManager_.list().map((it) => it.info)
    } catch (err) {
      console.log('error', err)
      return []
    }
  }

  async findInfoById(hwId: string): Promise<IHwInfo | null> {
    return this.hwManager_.findHw(hwId)?.info ?? null
  }

  async isSupportHw(hwId: string): Promise<boolean> {
    return this.hwManager_.findHw(hwId) ? true : false
  }

  async serialPortList(hwId: string): Promise<SerialPort.PortInfo[]> {
    const hw = this.hwManager_.findHw(hwId)
    if (!hw) return []
    const list = await this.serialPortService.list()
    if (!hw.operator.isMatch) {
      console.log('isMatch 함수가 없습니다. 전체 시리얼포트를 리턴합니다')
      return list
    }
    return list.filter(hw.operator.isMatch)
  }

  // TODO 이름 변경, checkReadable
  async isReadable(hwId: string, portPath: string): Promise<boolean> {
    return this.hwManager_.isRegisteredHw(hwId)
    // if (!this._hwManager.isRegisteredHw(hwId)) return false
    // const { info, operator } = this._hwManager.findHw(hwId) ?? {}
    // if (!info || !operator) {
    //     console.log(`isReadable: false, not registered hw, ${hwId}, ${portPath}:`)
    //     return false
    // }
    // const found = (await this.serialPortList(hwId)).find((it) => it.path === portPath)
    // return found ? true : false
  }

  async downloadDriver(driverUri: string): Promise<void> {
    if (driverUri.startsWith('http://') || driverUri.startsWith('https://')) {
      shell.openExternal(driverUri)
    } else {
      const folder = await this.contextService.get('DRIVER_FOLDER')
      shell.openPath(path.resolve(folder, driverUri))
    }
  }

  async downloadFirmware(firmwareUri: string): Promise<void> {
    if (firmwareUri.startsWith('http://') || firmwareUri.startsWith('https://')) {
      shell.openExternal(firmwareUri)
    } else {
      const folder = await this.contextService.get('FIRMWARE_FOLDER')
      shell.openPath(path.resolve(folder, firmwareUri))
    }
  }

  /**
   * 하드웨어를 선택하기
   * @param hwId
   * @returns
   */
  async selectHw(hwId: string): Promise<void> {
    this.hwManager_.selectHw(hwId)
  }

  async unselectHw(hwId: string): Promise<void> {
    this.hwManager_.unselectHw(hwId)
    this.hwServer_.stop()
  }

  async selectSerialPort(hwId: string, portPath: string): Promise<void> {
    this.hwManager_.selectSerialPort(hwId, portPath)
  }

  async stopServer(): Promise<void> {
    await this.hwServer_.stop()
  }
}
