import { BehaviorSubject } from 'rxjs'
import SerialPort from 'serialport'
import { HwChannel } from 'src/constants/channels'
import { IHwInfo } from 'src/custom-types/hw-types'
import { ProxyPropertyType } from 'src/electron-ipc-cat/common'

export type HwServerState = {
    hwId?: string
    running: boolean
}

export interface IHwService {
    hwServerState$: BehaviorSubject<HwServerState>
    start(hwId: string, portPath: string): Promise<void>
    stop(): Promise<void>
    stopServer(): Promise<void>
    getHwServerState(): Promise<HwServerState>
    serialPortList(hwId: string): Promise<SerialPort.PortInfo[]>
    downloadDriver(driverUri: string): Promise<void>
    downloadFirmware(firmwareUri: string): Promise<void>
    findInfoById(hwId: string): Promise<IHwInfo>
    isSupportHw(hwId: string): Promise<boolean>
    infoList(): Promise<IHwInfo[]>
    isReadable(hwId: string, portPath: string): Promise<boolean>
    selectHw(hwId: string): Promise<void>
}

export const HwServiceIPCDescriptor = {
    channel: HwChannel.name,
    properties: {
        hwServerState$: ProxyPropertyType.Value$,
        getHwServerState: ProxyPropertyType.Function,
        serialPortList: ProxyPropertyType.Function,
        downloadDriver: ProxyPropertyType.Function,
        downloadFirmware: ProxyPropertyType.Function,
        infoList: ProxyPropertyType.Function,
        findInfoById: ProxyPropertyType.Function,
        isSupportHw: ProxyPropertyType.Function,
        isReadable: ProxyPropertyType.Function,
        start: ProxyPropertyType.Function,
        stop: ProxyPropertyType.Function,
        stopServer: ProxyPropertyType.Function,
        selectHw: ProxyPropertyType.Function,
    },
}
