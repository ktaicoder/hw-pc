import { SerialPortHelper } from './helper/SerialPortHelper'

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
}

export type SerialPortMatchFn = (portInfo: ISerialPortInfo) => boolean
export type SerialPortHelperCreateFn = (path: string) => SerialPortHelper

export interface IHwContext {
    provideSerialPortHelper?: () => SerialPortHelper
}

/**
 * 하드웨어
 */
export interface IHw {
    commands: string[]
    control: () => any
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
export enum HwKind {
    serial = 'serial',
}

export interface IHwControl {
    isReadable: () => boolean
    setContext: (context: IHwContext | undefined | null) => void
}

export interface IHwOperator {
    createSerialPortHelper?: (path: string) => SerialPortHelper
    isMatch?: (portInfo: ISerialPortInfo) => boolean
}

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
    hwKind: HwKind
    hwId: string
    hwName: string | Record<'ko' | 'en', string>
    supportPlatforms: SupportPlatform[]
    category: HwCategory
    guideVideo?: string
    homepage?: string
    email?: string
    pcDrivers: PcDriver[]
    firmwareFile?: string
}

/**
 * 하드웨어 디스크립터
 */
export type HardwareDescriptor = {
    commands: string[]
}

/**
 * HwControl 생성 함수
 */
export type HwControlFactoryFn = () => IHwControl
