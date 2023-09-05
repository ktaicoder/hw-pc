import { shell } from 'electron'
import { injectable } from 'inversify'
import pSeries from 'p-series'
import path from 'path'
import {
  BehaviorSubject,
  combineLatest,
  filter,
  finalize,
  firstValueFrom,
  from,
  Subject,
  Subscription,
  switchMap,
  take,
  tap,
} from 'rxjs'
import { codingpack } from 'src/codingpack'
import { HardwareDescriptors } from 'src/custom'
import { IHwInfo, ISerialPortInfo } from 'src/custom-types'
import { DeviceOpenState, IHwDescriptor, IUiLogMessage, UiDeviceState } from 'src/custom-types/basic-types'
import { HcpWebSocketServer } from 'src/hcp/HcpWebSocketServer'
import { CodingpackHwManager } from 'src/hw-server/codingpack/CodingpackHwManager'
import { CodingpackSocketIoServer } from 'src/hw-server/codingpack/CodingpackSocketIoServer'
import { createHcpServer } from 'src/hw-server/util/createHcpServer'
import { lazyInject } from 'src/services/container'
import { ObservableField } from 'src/util/ObservableField'
import { IContextService } from '../context/IContextService'
import { ISerialPortService } from '../serialport/ISerialPortService'
import serviceIdentifier from '../serviceIdentifier'
import { createHcpHwManager } from './createHcpHwManager'
import { deviceStateManager } from './DeviceStateManager'
import { IHwService } from './IHwService'
import { HWID, HwServerState } from './types'
import { uiLogger } from './UiLogger'

type HwServer =
  | {
      kind: 'codingpack'
      server: CodingpackSocketIoServer
    }
  | {
      kind: 'hcp'
      server: HcpWebSocketServer
    }

@injectable()
export class HwService implements IHwService {
  @lazyInject(serviceIdentifier.Context) private readonly contextService!: IContextService
  @lazyInject(serviceIdentifier.SerialPort) private readonly serialPortService!: ISerialPortService

  /**
   * @override
   */
  public hwServerState$ = new BehaviorSubject<HwServerState>({ running: false, hwId: undefined })

  public consoleMessage$ = new Subject<IUiLogMessage>()

  public webSocketClientCount$ = new BehaviorSubject(0)

  public deviceState$ = new BehaviorSubject<UiDeviceState>({
    txTimestamp: 0,
    txBytes: 0,
    rxTimestamp: 0,
    rxBytes: 0,
  })

  public deviceOpenState$ = new BehaviorSubject<DeviceOpenState>('closed')

  private hwId$ = new ObservableField<HWID | null>(null)

  private resetRequest$ = new BehaviorSubject(0)

  private hwServer_: HwServer | undefined

  private subscription_?: Subscription

  private serverSubscription_?: Subscription

  constructor() {
    const subscription = combineLatest([this.hwId$.observe(), this.resetRequest$])
      .pipe(
        // debounceTime(100),
        switchMap(([hwId]) => {
          if (hwId) {
            return from(pSeries([() => this.stopServer_(), () => this.startServer_(hwId)]))
          } else {
            return from(this.stopServer_())
          }
        }),
        finalize(() => {
          console.warn('HwService finalized()')
        }),
      )
      .subscribe()

    subscription.add(
      deviceStateManager.observe().subscribe((data) => {
        this.deviceState$.next(data)
      }),
    )

    subscription.add(
      uiLogger.message$.subscribe((msg) => {
        this.consoleMessage$.next(msg)
      }),
    )

    this.subscription_ = subscription
  }

  /**
   * 서버 재시작
   */
  restartServer = async (): Promise<void> => {
    const serialPort = await this.getSerialPortPath()
    const hwId = this.hwId$.value
    if (!serialPort || !hwId) {
      uiLogger.d('HwService', 'cannot restart server')
      return
    }
    this.resetRequest$.next(Date.now())

    await firstValueFrom(
      this.hwServerState$.pipe(
        filter((it) => !it.running),
        take(1),
        switchMap(() => this.hwServerState$),
        filter((it) => it.running),
        take(1),
        tap(() => {
          this.selectSerialPort(hwId, serialPort)
        }),
      ),
    )
  }

  getHcpServer = (): HcpWebSocketServer | undefined => {
    const state = this.hwServer_
    if (!state) return
    if (state.kind === 'hcp') {
      return state.server
    }
    return undefined
  }

  private startServer_ = async (hwId: HWID): Promise<any> => {
    await this.stopServer_()
    if (hwId === 'codingpack') {
      return this.startCodingpackServer_(hwId)
    }
    return this.startHcpServer_(hwId)
  }

  private stopServer_ = async () => {
    if (this.hwServer_) {
      const { kind, server } = this.hwServer_
      uiLogger.i('HwService.stopServer()', `${kind} server`)
      await server.stop()
      this.hwServer_ = undefined
    }
    deviceStateManager.reset() // 디바이스 상태 리셋
    this.hwServerState$.next({ running: false, hwId: undefined })

    this.deviceOpenState$.next('closed')
    this.serverSubscription_?.unsubscribe()
    this.serverSubscription_ = undefined
  }

  private startHcpServer_ = async (hwId: Exclude<HWID, 'codingpack'>): Promise<HcpWebSocketServer> => {
    uiLogger.i('HwService', 'startHcpServer()')
    await this.stopServer_()
    const hwManager = createHcpHwManager(hwId)
    deviceStateManager.reset()

    uiLogger.i('HwService', 'startHcpServer() createHcpServer()')
    const server = createHcpServer(this.webSocketClientCount$, hwManager)
    this.hwServer_ = { kind: 'hcp', server }

    const subscription = hwManager.observeDeviceOpenState().subscribe((state) => {
      this.deviceOpenState$.next(state)
    })

    this.subscription_ = subscription

    server.start()
    this.hwServerState$.next({ hwId: hwManager.getHwId(), running: true })

    return server
  }

  private startCodingpackServer_ = async (hwId: HWID): Promise<CodingpackSocketIoServer> => {
    await this.stopServer_()

    uiLogger.i('HwService', 'startCodingpackServer()')
    const hwManager = new CodingpackHwManager()
    const server = new CodingpackSocketIoServer(this.webSocketClientCount$, hwManager)
    this.hwServer_ = { kind: 'codingpack', server }

    const subscription = hwManager.observeDeviceOpenState().subscribe((state) => {
      this.deviceOpenState$.next(state)
    })

    this.subscription_ = subscription

    server.start()
    this.hwServerState$.next({ hwId, running: true })

    return server
  }

  async getHwServerState(): Promise<HwServerState> {
    return this.hwServerState$.value
  }

  isReadable = async (hwId: HWID, portPath: string): Promise<boolean> => {
    const { kind, server } = this.hwServer_ ?? {}
    if (!kind || !server) return false
    if (kind === 'codingpack') {
      const mgr = server.getHwManager()
      return (
        hwId === mgr.getHwId() &&
        mgr.getDevice()?.getSerialPortPath() === portPath &&
        mgr.getDevice()?.isOpened() === true
      )
    }

    if (kind === 'hcp') {
      const mgr = server.getHcpHwManager()
      return (
        hwId === mgr.getHwId() &&
        mgr.getDevice()?.getSerialPortPath() === portPath &&
        mgr.getDevice()?.isOpened() === true
      )
    }

    return false
  }

  async infoList(): Promise<IHwInfo[]> {
    try {
      return Object.values(HardwareDescriptors)
        .filter((it) => it.hwId !== 'codingpack')
        .map((it) => it.info)
    } catch (err) {
      console.log('error', err)
      return []
    }
  }

  private hwDescriptorOf_(hwId: HWID): IHwDescriptor | null {
    if (hwId === codingpack.hwId) return codingpack
    return HardwareDescriptors[hwId] ?? null
  }

  async findInfoById(hwId: HWID): Promise<IHwInfo | null> {
    return this.hwDescriptorOf_(hwId)?.info ?? null
  }

  async isSupportHw(hwId: HWID): Promise<boolean> {
    return HardwareDescriptors[hwId] ? true : false
  }

  /**
   * 시리얼 포트 목록 조회
   * 특정 하드웨어에서 지원하는 시리얼 포트 목록을 조회
   * @param hwId 하드웨어 ID
   * @returns
   */
  async serialPortList(hwId: HWID): Promise<ISerialPortInfo[]> {
    const list = await this.serialPortService.list()
    const hw = this.hwDescriptorOf_(hwId)?.hw
    if (!hw) return list

    const ports = list.filter((portInfo) => hw.isPortMatch(portInfo, uiLogger))
    ports.sort((a, b) => a.path.localeCompare(b.path))
    return ports
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
  async selectHw(hwId: HWID): Promise<void> {
    console.log('HwService.selectHw()', hwId)
    if (hwId === this.hwId$.value) {
      console.log('already selected hwId=', hwId)
      return
    }

    this.hwId$.setValue(hwId)
  }

  async unselectHw(): Promise<void> {
    console.log('HwService.unselectHw()', this.hwId$.value)
    this.hwId$.setValue(null)
  }

  async unselectSerialPort(): Promise<void> {
    console.log('HwService.unselectSerialPort()')
    const { kind, server } = this.hwServer_ ?? ({} as any)
    if (!kind || !server) {
      console.warn('server not started, select hwId first')
      return
    }

    if (kind === 'codingpack') {
      const s = server as CodingpackSocketIoServer
      await s.getHwManager().close()
      return
    }

    if (kind === 'hcp') {
      const s = server as HcpWebSocketServer
      await s.getHcpHwManager().close()
      return
    }
  }

  async getSerialPortPath(): Promise<string | undefined> {
    const hwServer = this.hwServer_
    if (!hwServer) return undefined
    if (hwServer.kind === 'hcp') {
      const hwMgr = hwServer.server.getHcpHwManager()
      return hwMgr.getDevice()?.getSerialPortPath()
    } else if (hwServer.kind === 'codingpack') {
      const hwMgr = hwServer.server.getHwManager()
      return hwMgr.getDevice()?.getSerialPortPath()
    }
    return undefined
  }

  async selectSerialPort(hwId: HWID, portPath: string): Promise<void> {
    const { kind, server } = this.hwServer_ ?? ({} as any)
    console.log('HwService.selectSerialPort()', hwId, portPath, kind)

    if (!kind || !server) {
      // 하드웨어를 먼저 선택하세요
      console.warn('server not started, select hwId first')
      return
    }

    if (server.getHwId() !== hwId) {
      // 하드웨어를 먼저 선택하세요
      console.warn(`server hardware is not matched, serverHwId=${server.getHwId()} != ${hwId}`)
      return
    }

    if (kind === 'codingpack') {
      const s = server as CodingpackSocketIoServer
      await s.getHwManager().close()
      await new Promise((resolve) => {
        setTimeout(resolve, 400)
      })
      await s.getHwManager().openSerialPort(portPath)
      return
    }

    if (kind === 'hcp') {
      const s = server as HcpWebSocketServer
      console.log('HwService.selectSerialPort() step#1')
      try {
        await s.getHcpHwManager().close()
      } catch (err) {
        console.log('HwService.selectSerialPort() error', err.message)
      }
      console.log('HwService.selectSerialPort() step#2')
      await new Promise((resolve) => {
        setTimeout(resolve, 400)
      })

      console.log('HwService.selectSerialPort() step#3')
      await s.getHcpHwManager().openDevice({ portPath })
      return
    }

    console.warn('[HwService.selectSerialPort] unknown kind: ', kind)
    return
  }

  async stopServer(): Promise<void> {
    console.log('HwService.stopServer()')
    this.hwId$.setValue(null)
    // null로 설정하면 stopServer_()가 호출된다
  }
}
