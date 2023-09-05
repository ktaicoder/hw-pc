import { Observable } from 'rxjs'
import { HwChannel } from 'src/constants/channels'
import {
  DeviceOpenState,
  IHwInfo,
  ISerialPortInfo,
  IUiLogMessage,
  UiDeviceState,
} from 'src/custom-types/basic-types'
import { ProxyPropertyType } from 'src/electron-ipc-cat/common'
import { HcpWebSocketServer } from 'src/hcp/HcpWebSocketServer'
import { HwServerState } from './types'

export interface IHwService {
  // 이거는 ipc가 아님
  getHcpServer(): HcpWebSocketServer | undefined

  consoleMessage$: Observable<IUiLogMessage>
  hwServerState$: Observable<HwServerState>
  webSocketClientCount$: Observable<number>
  deviceState$: Observable<UiDeviceState>
  deviceOpenState$: Observable<DeviceOpenState>

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
  unselectHw(): Promise<void>
  selectSerialPort(hwId: string, portPath: string): Promise<void>
  unselectSerialPort(): Promise<void>
  getSerialPortPath(): Promise<string | undefined>
  restartServer(): Promise<void>
}

export const HwServiceIPCDescriptor = {
  channel: HwChannel.name,
  properties: {
    consoleMessage$: ProxyPropertyType.Value$,
    hwServerState$: ProxyPropertyType.Value$,
    webSocketClientCount$: ProxyPropertyType.Value$,
    deviceConnected$: ProxyPropertyType.Value$,
    deviceState$: ProxyPropertyType.Value$,
    deviceOpenState$: ProxyPropertyType.Value$,
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
    unselectSerialPort: ProxyPropertyType.Function,
    getSerialPortPath: ProxyPropertyType.Function,
    restartServer: ProxyPropertyType.Function,
  },
}
