import { shell } from 'electron'
import { injectable } from 'inversify'
import path from 'path'
import { BehaviorSubject, filter, firstValueFrom, take, timeout, timer } from 'rxjs'
import SerialPort from 'serialport'
import { controls as HwRegistry } from 'src/custom'
import { IHwInfo } from 'src/custom-types/hw-types'
import { lazyInject } from 'src/services/container'
import { IContextService } from '../context/interface'
import { ISerialPortService } from '../serialport/interface'
import serviceIdentifier from '../serviceIdentifier'
import { HwControlManager } from './HwRequestHandler'
import { HwServer } from './HwServer'
import { HwServerState, IHwService } from './interface'

@injectable()
export class HwService implements IHwService {
    @lazyInject(serviceIdentifier.Context) private readonly contextService!: IContextService
    @lazyInject(serviceIdentifier.SerialPort) private readonly serialPortService!: ISerialPortService

    /**
     * @override
     */
    public hwServerState$ = new BehaviorSubject<HwServerState>({ running: false })

    private _controlManager = new HwControlManager()
    private _serverDisposeFn: (() => Promise<void>) | undefined = undefined

    constructor() {
        // empty
    }

    async getHwServerState(): Promise<HwServerState> {
        return this.hwServerState$.value
    }

    private _onStop = () => {
        console.log('hw service stopped')
        this.stop()
    }

    async infoList(): Promise<IHwInfo[]> {
        try {
            return Object.values(HwRegistry).map((it) => it.info)
        } catch (err) {
            console.log('error', err)
            return []
        }
    }

    async findInfoById(hwId: string): Promise<IHwInfo> {
        return HwRegistry[hwId].info
    }

    async isSupportHw(hwId: string): Promise<boolean> {
        return hwId in HwRegistry
    }

    async serialPortList(hwId: string): Promise<SerialPort.PortInfo[]> {
        const hw = HwRegistry[hwId]
        const list = await this.serialPortService.list()
        return list.filter(hw.operator.isMatch)
    }

    async isReadable(hwId: string, portPath: string): Promise<boolean> {
        const readable = this._controlManager.isHwReady(hwId)

        if (!readable) return false

        return true
        // const sp = new SerialPort(portPath, {
        //     autoOpen: true,
        //     baudRate: 38400,
        //     lock: false,
        // })
        // sp.open()
        // sp.close()
        // return sp.isOpen
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

    private initControls() {}

    private findSerialPortInfo = async (portPath: string): Promise<SerialPort.PortInfo | undefined> => {
        const list = await SerialPort.list()
        return list.find((it) => it.path === portPath)
    }

    /**
     * 하드웨어를 선택하면, 동작중인 서버를 중지시킨다
     * @param hwId
     * @returns
     */
    async selectHw(hwId: string): Promise<void> {
        const state = this.hwServerState$.value ?? {}
        if (state.hwId === hwId) {
            return
        }
        await this.stopServer()
        this.hwServerState$.next({ hwId, running: false })
    }

    async start(hwId: string, portPath: string): Promise<void> {
        await this.stopServer()
        console.log(`hw service starting: ${hwId},  ${portPath}`)

        const portInfo = await this.findSerialPortInfo(portPath)
        if (!portInfo) {
            console.log('cannot find serialPort:' + portPath)
            return
        }

        const requestHandler = await this._controlManager.createSerialPortRequestHandler(hwId, portPath)

        const server = new HwServer(hwId, requestHandler, { listenPort: 4000 })
        await firstValueFrom(
            server.observeRunning().pipe(
                filter((it) => it === true),
                timeout(5000),
            ),
        )
        console.log('hw service started')
        this.hwServerState$.next({ hwId, running: true })

        const subscription = server
            .observeRunning()
            .pipe(
                filter((it) => it === false),
                take(1),
            )
            .subscribe(() => {
                this._onStop()
            })

        this._serverDisposeFn = async () => {
            try {
                await server.stop()
            } catch (ignore: any) {
                console.log(ignore.message)
            }
            try {
                subscription.unsubscribe()
            } catch (ignore: any) {}
        }
    }

    async stopServer(): Promise<void> {
        if (this._serverDisposeFn) {
            await this._serverDisposeFn?.()
        }
        this._serverDisposeFn = undefined
        const state = this.hwServerState$.value ?? {}
        state.running = false
        this.hwServerState$.next(state)
    }

    async stop(): Promise<void> {
        if (this._serverDisposeFn) {
            await this._serverDisposeFn?.()
        }
        this._serverDisposeFn = undefined
        this.hwServerState$.next({ running: false })
    }
}
