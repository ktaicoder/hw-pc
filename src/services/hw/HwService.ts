import { shell } from 'electron'
import { injectable } from 'inversify'

import path from 'path'
import { BehaviorSubject, Subscription } from 'rxjs'
import SerialPort from 'serialport'
import { IHwInfo, HwKind } from 'src/custom-types'
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
    private _hwServer: HwServer
    private _hwManager: HwManager
    private _hwServerSubscription?: Subscription | null = null

    constructor() {
        this._hwManager = new HwManager()
        this._hwServer = new HwServer(this._hwManager)
        const subscription = this._hwServer.observeRunning().subscribe((running) => {
            this._updateStateRunning(running)
        })

        subscription.add(
            this._hwManager.observeHwIds().subscribe((hwIds) => {
                const prev = this.hwServerState$.value
                if (hwIds.length === 0) {
                    this._updateStateHwId(undefined)
                } else {
                    const hwId = prev.hwId
                    if (hwId) {
                        this._updateStateHwId(hwIds.includes(hwId) ? hwId : undefined)
                    }
                }
            }),
        )
        this._hwServerSubscription = subscription
        this._hwServer.start()
    }

    private _updateStateHwId = (hwId: string | undefined) => {
        const prev = { ...this.hwServerState$.value }
        prev.hwId = hwId
        this.hwServerState$.next(prev)
    }

    private _updateStateRunning = (running: boolean) => {
        const prev = { ...this.hwServerState$.value }
        prev.running = running
        this.hwServerState$.next(prev)
    }

    async getHwServerState(): Promise<HwServerState> {
        return this.hwServerState$.value
    }

    async infoList(): Promise<IHwInfo[]> {
        try {
            return this._hwManager.list().map((it) => it.info)
        } catch (err) {
            console.log('error', err)
            return []
        }
    }

    async findInfoById(hwId: string): Promise<IHwInfo | null> {
        return this._hwManager.findHw(hwId)?.info ?? null
    }

    async isSupportHw(hwId: string): Promise<boolean> {
        return this._hwManager.findHw(hwId) ? true : false
    }

    async serialPortList(hwId: string): Promise<SerialPort.PortInfo[]> {
        const hw = this._hwManager.findHw(hwId)
        if (!hw) return []
        const list = await this.serialPortService.list()
        if (!hw.operator.isMatch) {
            console.log('isMatch 함수가 없습니다. 전체 시리얼포트를 리턴합니다')
            return list
        }
        return list.filter(hw.operator.isMatch)
    }

    private _tryOpenAndClose = async (sp: SerialPort): Promise<boolean> => {
        return new Promise<boolean>((resolve, reject) => {
            sp.open((err) => {
                if (err) {
                    resolve(false)
                } else {
                    sp.close()
                    resolve(true)
                }
            })
        })
    }

    // TODO 이름 변경, checkReadable
    async isReadable(hwId: string, portPath: string): Promise<boolean> {
        return this._hwManager.isRegisteredHw(hwId)
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

    private findSerialPortInfo = async (portPath: string): Promise<SerialPort.PortInfo | undefined> => {
        const list = await SerialPort.list()
        return list.find((it) => it.path === portPath)
    }

    /**
     * 하드웨어를 선택하기
     * @param hwId
     * @returns
     */
    async selectHw(hwId: string): Promise<void> {
        this._hwManager.selectHw(hwId)
        this._updateStateHwId(hwId)
        if (!this._hwServer.isRunning) {
            this._hwServer.start()
        }
    }

    async unselectHw(hwId: string): Promise<void> {
        this._hwManager.unselectHw(hwId)
        this._updateStateHwId(undefined)
    }

    async selectSerialPort(hwId: string, portPath: string): Promise<void> {
        this._hwManager.selectSerialPort(hwId, portPath)
        this._updateStateHwId(hwId)
        if (!this._hwServer.isRunning) {
            this._hwServer.start()
        }
    }

    async stopServer(): Promise<void> {
        this._updateStateRunning(false)
    }
}
