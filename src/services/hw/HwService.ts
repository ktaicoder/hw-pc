import { shell } from 'electron'
import { injectable } from 'inversify'
import path from 'path'
import { BehaviorSubject, finalize, from, Subject, Subscription, switchMap } from 'rxjs'
import { codingpack } from 'src/codingpack'
import { HardwareDescriptors } from 'src/custom'
import { IHwInfo, ISerialPortInfo } from 'src/custom-types'
import { IHwDescriptor, IUiLogMessage, UiDeviceState } from 'src/custom-types/basic-types'
import { HcpHwManager } from 'src/hcp/HcpHwManager'
import { HcpWebSocketServer } from 'src/hcp/HcpWebSocketServer'
import { CodingpackSocketIoServer } from 'src/hw-server/codingpack/CodingpackSocketIoServer'
import { createHcpServer } from 'src/hw-server/util/createHcpServer'
import { lazyInject } from 'src/services/container'
import { ObservableField } from 'src/util/ObservableField'
import { IContextService } from '../context/interface'
import { ISerialPortService } from '../serialport/interface'
import serviceIdentifier from '../serviceIdentifier'
import { CodingpackHwManager } from './../../hw-server/codingpack/CodingpackHwManager'
import { DeviceStateManager } from './DeviceStateManager'
import { HwServerState, IHwService } from './interface'
import { UiLogger } from './UiLogger'

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

  private deviceStateManager_ = new DeviceStateManager()

  public hwDescriptor$ = new ObservableField<IHwDescriptor | null>(null)

  public serialPortPath$ = new ObservableField<string | null>(null)

  private hwServer_: HwServer | undefined

  private subscription_?: Subscription | null = null

  private uiLogger_: UiLogger

  constructor() {
    const subscription = this.hwDescriptor$
      .observe()
      .pipe(
        // debounceTime(100),
        switchMap((hwDescriptor) => {
          if (hwDescriptor) {
            return from(this.startServer_(hwDescriptor))
          } else {
            return from(this.stopServer_())
          }
        }),
        finalize(() => {
          console.warn('HwService finaalized()')
        }),
      )
      .subscribe()

    subscription.add(
      this.deviceStateManager_.observe().subscribe((data) => {
        this.deviceState$.next(data)
      }),
    )
    this.subscription_ = subscription
    this.uiLogger_ = new UiLogger(this.consoleMessage$)
  }

  private startServer_ = async (hwDescriptor: IHwDescriptor): Promise<any> => {
    await this.stopServer_()
    if (hwDescriptor.hwId === 'codingpack') {
      return this.startCodingpackServer_(hwDescriptor)
    }
    return this.startHcpServer_(hwDescriptor)
  }

  private stopServer_ = async () => {
    if (this.hwServer_) {
      const { kind, server } = this.hwServer_
      this.uiLogger_.i('HwService.stopServer()', `${kind} server`)
      await server.stop()
      this.hwServer_ = undefined
    }
    this.deviceStateManager_.reset() // 디바이스 상태 리셋
    this.hwServerState$.next({ running: false })
  }

  private startHcpServer_ = async (hwDescriptor: IHwDescriptor): Promise<HcpWebSocketServer> => {
    await this.stopServer_()

    this.uiLogger_.i('HwService', 'startHcpServer()')
    const hcpHwManager = new HcpHwManager(hwDescriptor, this.deviceStateManager_, this.uiLogger_)
    const server = createHcpServer(this.webSocketClientCount$, this.uiLogger_, hcpHwManager)
    this.hwServer_ = { kind: 'hcp', server }

    server.start()
    this.hwServerState$.next({ hwId: hwDescriptor.hwId, running: true })

    return server
  }

  private startCodingpackServer_ = async (hwDescriptor: IHwDescriptor): Promise<CodingpackSocketIoServer> => {
    await this.stopServer_()

    this.uiLogger_.i('HwService', 'startCodingpackServer()')
    const hwManager = new CodingpackHwManager(this.uiLogger_)
    const server = new CodingpackSocketIoServer(this.webSocketClientCount$, hwManager, this.uiLogger_)
    this.hwServer_ = { kind: 'codingpack', server }

    server.start()
    this.hwServerState$.next({ hwId: hwDescriptor.hwId, running: true })

    return server
  }

  async getHwServerState(): Promise<HwServerState> {
    return this.hwServerState$.value
  }

  isReadable = async (hwId: string, portPath: string): Promise<boolean> => {
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

  private hwDescriptorOf_(hwId: string): IHwDescriptor | null {
    if (hwId === codingpack.hwId) return codingpack
    return HardwareDescriptors[hwId] ?? null
  }

  async findInfoById(hwId: string): Promise<IHwInfo | null> {
    return this.hwDescriptorOf_(hwId)?.info ?? null
  }

  async isSupportHw(hwId: string): Promise<boolean> {
    return HardwareDescriptors[hwId] ? true : false
  }

  /**
   * 시리얼 포트 목록 조회
   * 특정 하드웨어에서 지원하는 시리얼 포트 목록을 조회
   * @param hwId 하드웨어 ID
   * @returns
   */
  async serialPortList(hwId: string): Promise<ISerialPortInfo[]> {
    const list = await this.serialPortService.list()
    const hw = this.hwDescriptorOf_(hwId)?.hw
    if (!hw) return list

    const ports = list.filter((portInfo) => hw.isPortMatch(portInfo, this.uiLogger_))
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
  async selectHw(hwId: string): Promise<void> {
    if (hwId === this.hwDescriptor$.value?.hwId) {
      console.log('already selected hwId=', hwId)
      return
    }

    const descriptor = this.hwDescriptorOf_(hwId)
    this.hwDescriptor$.setValue(descriptor)
  }

  async unselectHw(): Promise<void> {
    console.log('unselectHw', this.hwDescriptor$.value?.hwId)
    this.hwDescriptor$.setValue(null)
  }

  async unselectSerialPort(): Promise<void> {
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

  async selectSerialPort(hwId: string, portPath: string): Promise<void> {
    const { kind, server } = this.hwServer_ ?? ({} as any)

    if (!kind || !server) {
      // 하드웨어를 먼저 선택하세요
      console.warn('server not started, select hwId first')
      return
    }

    if (server.getHwId() !== hwId) {
      // 하드웨어를 먼저 선택하세요
      console.warn(`server hardware is not matched, serverHwid=${server.getHwId()} != ${hwId}`)
      return
    }

    if (kind === 'codingpack') {
      const s = server as CodingpackSocketIoServer
      await s.getHwManager().close()
      await new Promise((resolve) => {
        setTimeout(resolve, 700)
      })
      await s.getHwManager().openSerialPort(portPath)
      return
    }

    if (kind === 'hcp') {
      const s = server as HcpWebSocketServer
      await s.getHcpHwManager().close()
      await new Promise((resolve) => {
        setTimeout(resolve, 700)
      })
      await s.getHcpHwManager().openSerialPort(portPath)
      return
    }

    console.warn('[HwService.selectSerialPort] unknown kind: ', kind)
    return
  }

  async stopServer(): Promise<void> {
    this.hwDescriptor$.setValue(null)
    // null로 설정하면 stopServer_()가 호출된다
  }
}
