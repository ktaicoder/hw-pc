import { IHwControl } from 'src/custom-types'
import { filter, firstValueFrom, map, take } from 'rxjs'
import { IUiLogger } from 'src/custom-types'
import { SerialDevice } from 'src/hw-server/serialport/SerialDevice'

export abstract class AbstractHwConrtol implements IHwControl {
  /**
   * 연결된 디바이스(serial)
   */
  protected device_ = (ctx: any): SerialDevice => {
    const { device } = ctx
    return device as SerialDevice
  }

  /**
   * PC 프로그램의 콘솔 로거
   */
  protected log = (ctx: any): IUiLogger => {
    const { uiLogger } = ctx
    return uiLogger as IUiLogger
  }

  /**
   * 디바이스(serial)에 write
   */
  protected write_ = async (ctx: any, values: Buffer | number[]): Promise<void> => {
    const device = this.device_(ctx)
    await device.write(values)
  }

  /**
   * 디바이스(serial)로부터 읽기
   */
  protected readNext_ = (ctx: any): Promise<Buffer> => {
    const device = this.device_(ctx)
    const now = Date.now()
    return firstValueFrom(
      device.observeReceivedData().pipe(
        filter((it) => it.timestamp > now),
        take(1),
        map((it) => it.dataBuffer),
      ),
    )
  }

  /**
   * 디바이스(serial)에 연결된 직후에 자동으로 호출됩니다
   */
  onDeviceOpened = async (ctx: any): Promise<void> => {
    // empty
  }

  /**
   * 디바이스(serial)가 닫히기 직전에 자동으로 호출됩니다.
   * 디바이스는 강제로 분리되거나 오류가 발생할 수 있으므로 호출되지 않을 수도 있습니다.
   */
  onDeviceWillClose = async (ctx: any): Promise<void> => {
    // empty
  }

  /**
   * 웹소켓 클라이언트가 연결되었고,
   * 디바이스(serial)가 OPEN 된 후에 한번 호출됩니다
   */
  onWebSocketConnected = async (ctx: any): Promise<void> => {
    // empty
  }

  /**
   * 웹소켓 클라이언트의 연결이 종료되었을 때 호출됩니다.
   * (참고) 웹소켓 클라이언트의 연결이 종료되어도
   * 디바이스(serial)는 여전히 동작중일 수 있습니다.
   *
   * 이럴 때 사용하세요.
   * 블록코딩의 실행이 중지된 경우, 웹소켓 연결도 종료됩니다.
   * 블록코딩이 실행하는 동안 LED를 켰고
   * 블록코딩의 실행이 중지된 후에, 자동으로 LED를 끄고 싶다면
   * onWebSocketDisconnected()에서 LED를 끄는 로직을 작성하세요.
   */
  onWebSocketDisconnected = async (ctx: any): Promise<void> => {
    // empty
  }
}
