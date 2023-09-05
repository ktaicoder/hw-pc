import { Observable } from 'rxjs'
import { DeviceOpenState, IDevice } from 'src/custom-types'
import { HcpPacket } from './HcpPacket'

export interface HwControlRequest {
  cmd: string
  args?: unknown[]
}

export interface HwControlResponse {
  success: boolean
  message?: string
  errorCode?: string
  data?: any
}

export interface IHcpPacketHandler {
  handle(packet: HcpPacket): Promise<void>
}

export interface IHcpHwManager {
  getHwId(): string
  getDevice(): IDevice | null
  observeDeviceOpenState(): Observable<DeviceOpenState>
  observeDevice(): Observable<IDevice | null>
  observeConnectedDevice(): Observable<IDevice>
  getConnectedDevice(): IDevice | null
  close(): Promise<void>
  runControlCmd(cmd: string, args?: any[]): Promise<any>

  // 디바이스를 open하는 것은 하드웨어 종류마다 다르므로 파라미터가 any
  openDevice(params: any): Promise<void>

  /**
   * 디바이스(serial)의 OPEN 후에
   * 웹소켓 클라이언트가 연결되면 호출됩니다.
   *
   * 블록코딩을 실행하면 웹소켓 클라이언트가 연결되고
   * 블록코딩 실행을 중지하면, 웹소켓 클라이언트의 연결이 끊어집니다.
   * 그래서, 블록코딩을 실행할 때마다 한번씩 onWebSocketConnected()가 호출됩니다.
   */
  onWebSocketConnected(options: {
    device: IDevice
    notificationManager: IHcpHwNotificationManager
  }): Promise<void>

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
  onWebSocketDisconnected(): Promise<void>
}

/**
 * 클라이언트별로 생성되는 notification 매니저
 */
export interface IHcpHwNotificationManager {
  notify(payload: any): void
  observe(): Observable<any>
}
