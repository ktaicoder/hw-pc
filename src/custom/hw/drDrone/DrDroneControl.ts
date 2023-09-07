import { uiLogger } from 'src/services/hw/UiLogger'
import { AbstractHwConrtol } from '../AbstractHwControl'
import { clamp, sleepAsync } from '../util'
import { DrDronAction, DrDronActionKey, IDrDroneControl } from './IDrDroneControl'

export class DrDroneControl extends AbstractHwConrtol implements IDrDroneControl {
  /**
   * 센서보정
   */
  calibrate = async (ctx: any): Promise<void> => {
    await this.writeCmd_(ctx, 1)
  }

  /**
   * 시동켜기
   */
  start = async (ctx: any): Promise<void> => {
    await this.writeCmd_(ctx, 3)
  }

  /**
   * 시동끔
   */
  turnOff = async (ctx: any): Promise<void> => {
    await this.writeCmd_(ctx, 5)
  }

  /**
   * 이륙
   */
  takeOff = async (ctx: any): Promise<void> => {
    await this.writeCmd_(ctx, 7)
  }

  /**
   * 착륙
   */
  land = async (ctx: any): Promise<void> => {
    await this.writeCmd_(ctx, 7)
  }

  /**
   * 움직이기
   */
  move = async (
    ctx: any,
    action: DrDronActionKey,
    speed: number,
    durationSec: number,
  ): Promise<void> => {
    if (!DrDronAction[action]) {
      uiLogger.w('DrDroneControl.move()', `invalid action:${action}`)
      return
    }

    const clampedSpeed = clamp(speed, 0, 100)
    if (clampedSpeed !== speed) {
      uiLogger.w(
        'DrDroneControl.move()',
        `speed value must be in range 0~100, but ${speed} received.`,
      )
    }

    await this.writeCmd_(ctx, 7, clampedSpeed, durationSec)
    await sleepAsync(durationSec * 1000)
  }

  /**
   * write command
   */
  private writeCmd_ = async (ctx: any, cmd: number, param1 = 0, param2 = 0, param3 = 0) => {
    const buf = [0xff, 0xff, cmd, param1, param2, param3, 0]
    this.updateCksum_(buf)
    await this.write_(ctx, buf)
  }

  /**
   * update checksums
   */
  private updateCksum_ = (buf: number[] | Buffer) => {
    let c = 0
    for (let i = 2; i < 6; i++) {
      c += buf[i]
    }
    buf[6] = ~c & 0xff
  }

  /**
   * 디바이스(serial)에 연결된 직후에 자동으로 호출됩니다
   */
  onDeviceOpened = async (ctx: any): Promise<void> => {
    const logTag = 'DrDroneControl.onDeviceOpened()'
    uiLogger.i(logTag, 'called')
  }

  /**
   * 디바이스(serial)가 닫히기 전에 자동으로 호출됩니다
   */
  onDeviceWillClose = async (ctx: any): Promise<void> => {
    const logTag = 'DrDroneControl.onDeviceWillClose()'
    uiLogger.i(logTag, 'called')
  }

  /**
   * 웹소켓 클라이언트가 연결되었고,
   * 시리얼 장치가 OPEN 된 후에 한번 호출됩니다
   */
  onWebSocketConnected = async (ctx: any): Promise<void> => {
    const logTag = 'DrDroneControl.onWebSocketConnected()'
    uiLogger.i(logTag, 'called')
  }

  /**
   * 클라이언트의 연결이 종료되었을 때,
   * 자동으로 호출해준다.
   */
  onWebSocketDisconnected = async (ctx: any): Promise<void> => {
    const logTag = 'DrDroneControl.onWebSocketDisconnected()'
    uiLogger.i(logTag, 'called')
    try {
      // ex) 모터 중지
      // await this.stopDCMotor(ctx)
    } catch (err) {}
  }
}
