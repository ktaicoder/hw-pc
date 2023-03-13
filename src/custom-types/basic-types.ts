import { Observable } from 'rxjs'
import { SerialPort } from 'serialport'
import Stream from 'stream'

/**
 * 시리얼포트 정보
 * serialport 모듈의 SerialPort.PortInfo와 동일하다
 * 라이브러리 의존성을 없애기 위해 같은 형태로 만들었다
 */
export interface ISerialPortInfo {
  path: string
  manufacturer?: string
  serialNumber?: string
  pnpId?: string
  locationId?: string
  productId?: string
  vendorId?: string
  friendlyName?: string
}

/**
 * 클라이언트 유형
 */
export type IHwClientType = 'normal' | 'blockcoding'

/**
 * 클라이언트 메타 정보
 */
export interface IHwClientMeta {
  clientType: IHwClientType
}

/**
 * 하드웨어 명령 실행 요청
 */
export interface IHwCmdRequest {
  requestId: string
  hwId: string
  clientMeta: IHwClientMeta
  cmd: string
  args: unknown[]
}

/**
 * 하드웨어 종류
 */
export type HwKindKey = 'serial' | 'terminal'

export type SupportPlatform = 'win32' | 'darwin'
export type DriverPlatform = 'win32-ia32' | 'win32-x64' | 'darwin-x64'
export type HwCategory = 'board' | 'robot' | 'module'

export type PcDriver = {
  name: string
  'win32-ia32'?: string
  'win32-x64'?: string
  'darwin-x64'?: string
}

/**
 * 하드웨어의 정보
 */
export interface IHwInfo {
  hwId: string
  hwKind: HwKindKey
  hwName: string | Record<'ko' | 'en', string>
  supportPlatforms: SupportPlatform[]
  category: HwCategory
  guideVideo?: string
  homepage?: string
  email?: string
  pcDrivers: PcDriver[]
  firmwareFile?: string
}

export interface ISerialDeviceOpenParams {
  serialPortPath: string
  uiLogger: IUiLogger
}

export interface IHw {
  hwId: string
  hwKind: HwKindKey
  isPortMatch: (portInfo: ISerialPortInfo, logger?: IUiLogger) => boolean
  createControl: () => IHwControl
  openDevice: (params: ISerialDeviceOpenParams) => ISerialDevice
}

export type HcpConnectionStatus = 'disconnected' | 'connecting' | 'preparing' | 'connected'

export interface IHwControl {
  /**
   * 디바이스(serial)의 OPEN 직후에 자동으로 호출됩니다
   */
  onDeviceOpened(ctx: any): Promise<void>

  /**
   * 디바이스(serial)의 CLOSE 전에 자동으로 호출됩니다
   */
  onDeviceWillClose(ctx: any): Promise<void>

  /**
   * 디바이스(serial)의 OPEN 후에
   * 웹소켓 클라이언트가 연결되면 호출됩니다.
   *
   * 블록코딩을 실행하면 웹소켓 클라이언트가 연결되고
   * 블록코딩 실행을 중지하면, 웹소켓 클라이언트의 연결이 끊어집니다.
   * 그래서, 블록코딩을 실행할 때마다 한번씩 onWebSocketConnected()가 호출됩니다.
   */
  onWebSocketConnected(ctx: any): Promise<void>

  /**
   * 웹소켓 클라이언트의 연결이 종료되었을 때 호출됩니다.
   * (참고) 웹소켓 클라이언트의 연결이 종료되어도
   * 디바이스(serial)는 여전히 동작중일 수 있습니다.
   *
   * **이럴 때 사용하세요**
   * 블록코딩의 실행이 중지된 경우, 웹소켓 연결은 자동으로 종료됩니다.
   * 블록코딩이 실행하는 동안 LED를 켰고
   * 만약, 블록코딩의 실행이 중지된 후에, 자동으로 LED를 끄고 싶다면
   * onWebSocketDisconnected()에서 LED를 끄는 로직을 작성하세요.
   */
  onWebSocketDisconnected(ctx: any): Promise<void>
}

export interface IHwDescriptor {
  hwId: string
  hwKind: HwKindKey

  hw: IHw
  info: IHwInfo
}

/**
 * UiLog는 디바이스 상세화면의 콘솔 UI의 로그를 의미합니다.
 * 로그 레벨(debug, info, warn, error)
 * 로그 레벨에 따라서 콘솔에서의 메시지 색상이 다릅니다
 */
export type UiLogLevel = 'd' | 'i' | 'w' | 'e'
export type UiLogMessageType = string | Uint8Array | number[]

/**
 * UI 로그 메시지
 */
export interface IUiLogMessage {
  level: UiLogLevel

  /**
   * 로그 태그
   */
  logTag: string

  /**
   * 로그 메시지
   * string, number[], Uint8Array 메시지를 남길 수 있습니다.
   * nodejs의 Buffer는 Uint8Array를 상속하므로 Buffer 타입도 가능합니다.
   */
  msg: UiLogMessageType
}

/**
 * 하드웨어를 의미한다
 */
export interface ISerialDevice {
  setUiLogger: (logger: IUiLogger | undefined) => void

  getSerialPortPath: () => string | undefined

  getState: () => SerialPortDeviceState

  isOpened: () => boolean

  open: (port: SerialPort, parser?: Stream.Transform) => Promise<void>

  write: (buffer: Buffer) => Promise<void>

  observeDeviceState: () => Observable<SerialPortDeviceState>

  observeOpenedOrNot: () => Observable<boolean>

  observeReceivedData: () => Observable<BufferTimestamped>

  waitUntilOpen: (timeoutMilli: number) => Promise<boolean>

  close: () => Promise<void>
}

export interface IUiLogger {
  d: (logTag: string, msg: UiLogMessageType) => void
  i: (logTag: string, msg: UiLogMessageType) => void
  w: (logTag: string, msg: UiLogMessageType) => void
  e: (logTag: string, msg: UiLogMessageType) => void
}

export type SerialPortDeviceState = 'opening' | 'opened' | 'closing' | 'closed'

export type BufferTimestamped = { timestamp: number; dataBuffer: Buffer }

export interface IHwServer {
  getHwId: () => string
  stop: () => Promise<void>
  start: () => void
}
