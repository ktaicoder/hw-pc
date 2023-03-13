import { ICodingpackControl } from './ICodingpackControl'

/**
 * 코디니팩 제어
 * 코디니팩은 일반 하드웨어와는 다르게 제어합니다.
 * 교구 업체들은 이 코드를 참고하지 마세요.
 */
export class CodingpackControl implements ICodingpackControl {
  /**
   * 디바이스(serial)에 연결된 직후에 자동으로 호출됩니다
   */
  onDeviceOpened = async (ctx: any): Promise<void> => {
    // empty
  }

  /**
   * 디바이스(serial)가 닫히기 직전에 자동으로 호출됩니다
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
