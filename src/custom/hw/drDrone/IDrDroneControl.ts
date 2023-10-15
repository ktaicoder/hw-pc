export type DrDronActionKey =
  | 'forward'
  | 'backward'
  | 'left'
  | 'right'
  | 'ccw'
  | 'cw'
  | 'up'
  | 'down'

const create = (title: string, cmd: number) => ({ title, cmd })

export const DrDronAction: Record<DrDronActionKey, { title: string; cmd: number }> = {
  forward: create('앞으로', 0x10),
  backward: create('뒤로', 0x12),
  left: create('왼쪽', 0x16),
  right: create('오른쪽', 0x14),
  ccw: create('반시계', 0x18),
  cw: create('시계방향', 0x19),
  up: create('상승', 0x1a),
  down: create('하강', 0xc),
}

/**
 * 컨트롤 인터페이스 - 클라이언트(ex: 블록코딩)에서 사용
 * 클라이언트는 이 인터페이스를 Proxy 하여 RPC 처럼 호출
 */
export interface IDrDroneControl {
  /**
   * 센서 보정
   */
  calibrate(ctx: any): Promise<void>

  /**
   * 시동켜기
   */
  start(ctx: any): Promise<void>

  /**
   * 시동끔
   */
  turnOff(ctx: any): Promise<void>

  /**
   * 이륙
   */
  takeOff(ctx: any): Promise<void>

  /**
   * 착륙
   */
  land(ctx: any): Promise<void>

  /**
   * 움직이기
   */
  move(ctx: any, action: DrDronActionKey, speed: number, durationSec: number): Promise<void>
}
