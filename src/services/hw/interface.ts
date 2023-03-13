import { BehaviorSubject, Observable } from 'rxjs'
import { HwChannel } from 'src/constants/channels'
import { IHwInfo, ISerialPortInfo, IUiLogMessage } from 'src/custom-types/basic-types'
import { ProxyPropertyType } from 'src/electron-ipc-cat/common'

export type HwServerState = {
  hwId?: string
  running: boolean
}

export interface IHwService {
  consoleMessage$: Observable<IUiLogMessage>
  hwServerState$: BehaviorSubject<HwServerState>
  stopServer(): Promise<void>
  getHwServerState(): Promise<HwServerState>
  serialPortList(hwId: string): Promise<ISerialPortInfo[]>
  downloadDriver(driverUri: string): Promise<void>
  downloadFirmware(firmwareUri: string): Promise<void>
  findInfoById(hwId: string): Promise<IHwInfo | null>
  isSupportHw(hwId: string): Promise<boolean>
  infoList(): Promise<IHwInfo[]>
  isReadable(hwId: string, portPath: string): Promise<boolean>
  selectHw(hwId: string): Promise<void>
  unselectHw(hwId: string): Promise<void>
  selectSerialPort(hwId: string, portPath: string): Promise<void>
}

export const HwServiceIPCDescriptor = {
  channel: HwChannel.name,
  properties: {
    consoleMessage$: ProxyPropertyType.Value$,
    hwServerState$: ProxyPropertyType.Value$,
    stopServer: ProxyPropertyType.Function,
    getHwServerState: ProxyPropertyType.Function,
    serialPortList: ProxyPropertyType.Function,
    downloadDriver: ProxyPropertyType.Function,
    downloadFirmware: ProxyPropertyType.Function,
    findInfoById: ProxyPropertyType.Function,
    isSupportHw: ProxyPropertyType.Function,
    infoList: ProxyPropertyType.Function,
    isReadable: ProxyPropertyType.Function,
    selectHw: ProxyPropertyType.Function,
    unselectHw: ProxyPropertyType.Function,
    selectSerialPort: ProxyPropertyType.Function,
  },
}
