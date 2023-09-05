import { uiLogger } from 'src/services/hw/UiLogger'
import { AbstractHwConrtol } from '../AbstractHwControl'
import { IWiseXboardPremiumControl } from './IWiseXboardPremiumControl'

const DEBUG = false

/**
 * 하드웨어 서비스
 */
export class WiseXboardPremiumControl extends AbstractHwConrtol implements IWiseXboardPremiumControl {
  /**
   * 일곱개의 핀값을 읽는다
   */
  private async read7_(ctx: any): Promise<number[]> {
    const buf = await this.readNext_(ctx)

    if (buf.length != 8) {
      console.warn('check delimiter', buf.toJSON())
    }

    if (buf.length < 8) {
      throw new Error('invalid line')
    }

    let cksum = 0
    for (let i = 0; i < 7; i++) {
      cksum ^= buf[i]
    }

    if (cksum != buf[7]) {
      throw new Error('checksum mismatch')
    }

    return new Array(7).fill(0).map((_, i) => buf[i] ?? 0)
  }

  /**
   * 일곱개의 핀값을 읽는다
   * 첵섬이 다르거나, 구분자가 다르면 한번더 시도한다
   */
  private async read7Retry_(ctx: any): Promise<number[]> {
    let remainCount = 2
    for (let i = 0; i < remainCount; i++) {
      remainCount--
      try {
        const ret = await this.read7_(ctx)
        console.log('_read7Retry() = ', ret)
        return ret
      } catch (err) {
        const msg: string = err.message ?? ''
        if (msg.includes('checksum mismatch') || msg.includes('check delimiter') || msg.includes('invalid line')) {
          console.log('retry _read7()')
          continue
        }

        throw err
      }
    }
    return new Array(7).fill(0)
  }

  /**
   * DC 모터1,2 속도 설정
   */
  async setDCMotorSpeedP(ctx: any, l1: number, r1: number, l2: number, r2: number): Promise<void> {
    if (l1 < -100) l1 = -100
    if (r1 < -100) r1 = -100
    if (l1 > 100) l1 = 100
    if (r1 > 100) r1 = 100
    if (l2 < -100) l2 = -100
    if (r2 < -100) r2 = -100
    if (l2 > 100) l2 = 100
    if (r2 > 100) r2 = 100
    if (l1 < 0) l1 = 256 + l1
    if (l2 < 0) l2 = 256 + l2
    if (r1 < 0) r1 = 256 + r1
    if (r2 < 0) r2 = 256 + r2

    const buf = [0x23, 5, 0x82, l1, r1, l2, r2, 0]
    let cksum = 0
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    await this.write_(ctx, buf)
  }

  /**
   * DC 모터1 속도 설정
   */
  async setDCMotor1SpeedP(ctx: any, l1: number, r1: number): Promise<void> {
    if (l1 < -100) l1 = -100
    if (r1 < -100) r1 = -100
    if (l1 > 100) l1 = 100
    if (r1 > 100) r1 = 100
    if (l1 < 0) l1 = 256 + l1
    if (r1 < 0) r1 = 256 + r1

    const buf = [0x23, 3, 0x85, l1, r1, 0]
    let cksum = 0
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    await this.write_(ctx, buf)
  }

  /**
   * DC 모터2 속도 설정
   */
  async setDCMotor2SpeedP(ctx: any, l2: number, r2: number): Promise<void> {
    if (l2 < -100) l2 = -100
    if (r2 < -100) r2 = -100
    if (l2 > 100) l2 = 100
    if (r2 > 100) r2 = 100
    if (l2 < 0) l2 = 256 + l2
    if (r2 < 0) r2 = 256 + r2

    const buf = [0x23, 3, 0x86, l2, r2, 0]
    let cksum = 0
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    await this.write_(ctx, buf)
  }

  /**
   * 모든 DC 모터 끄기
   */
  async stopDCMotorP(ctx: any): Promise<void> {
    const pkt = [0x23, 1, 0x83, 0]
    let cksum = 0
    for (let i = 2; i < pkt.length - 1; i++) {
      cksum ^= pkt[i]
    }
    pkt[pkt.length - 1] = cksum
    await this.write_(ctx, pkt)
  }

  /**
   * n번핀 서보모터 각도 angle로 정하기
   * pinNum = [1,5], angle=[-90, 90]
   */
  async setServoMotorAngleP(ctx: any, pinNum: number, angle: number): Promise<void> {
    if (angle < -90) angle = -90
    if (angle > 90) angle = 90
    if (angle < 0) angle = 255 + angle

    // 기존에 속도값은 전달하지 않는다
    // if (speed > 30) speed = 30
    // if (speed < 1) speed = 1
    const speed = 20

    if (pinNum < 3) pinNum = 3
    if (pinNum > 6) pinNum = 6

    let cksum = 0
    const buf = [0x23, 4, 0x81, pinNum, angle, speed, 0]
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    await this.write_(ctx, buf)
  }

  /**
   * 리모콘 값 읽기
   */
  async readRemoconP(ctx: any): Promise<number> {
    const values = this.read7Retry_(ctx)
    return values[6]
  }

  /**
   * 아날로그 핀 읽기
   */
  async analogReadP(ctx: any, pin: number): Promise<number> {
    // [pin1 ~ pin7]
    const values = await this.read7Retry_(ctx)
    const v = values[pin - 1]
    return v ?? 0
  }

  /**
   * 디지털 핀 읽기
   */
  async digitalReadP(ctx: any, pin: number): Promise<number> {
    // [pin1 ~ pin7]
    const values = await this.read7Retry_(ctx)
    const v = values[pin - 1]
    return v > 100 ? 1 : 0
  }

  /**
   * 디지털 n번핀 value로 정하기
   * pinNum = [0~5], value = [0,1]
   */
  async digitalWriteP(ctx: any, pinNum: number, value: number): Promise<void> {
    value = value <= 0 ? 0 : 1
    pinNum = pinNum <= 0 ? 0 : pinNum >= 5 ? 5 : pinNum
    if (DEBUG) console.log(`digitalWriteP : pinNo: ${pinNum}, value:${value}`)

    let cksum = 0
    const buf = [0x23, 3, 0x80, pinNum, value, 0]
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    await this.write_(ctx, buf)
  }

  /**
   * 키값 전송
   */
  async sendKeyP(ctx: any, key: number): Promise<void> {
    let cksum = 0
    const buf = [0x23, 2, 0x84, key, 0]
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    await this.write_(ctx, buf)
  }

  /**
   * 디바이스(serial)에 연결된 직후에 자동으로 호출됩니다
   */
  onDeviceOpened = async (ctx: any): Promise<void> => {
    const logTag = 'WiseXboardPremiumControl.onDeviceOpened()'
    uiLogger.i(logTag, 'called')
  }

  /**
   * 디바이스(serial)가 닫히기 전에 자동으로 호출됩니다
   */
  onDeviceWillClose = async (ctx: any): Promise<void> => {
    const logTag = 'WiseXboardPremiumControl.onDeviceWillClose()'
    uiLogger.i(logTag, 'called')
  }

  /**
   * implement IHwControl
   * 웹소켓 클라이언트가 연결되었고,
   * 시리얼 장치가 OPEN 된 후에 한번 호출됩니다
   */
  onWebSocketConnected = async (ctx: any): Promise<void> => {
    const logTag = 'WiseXboardPremiumControl.onWebSocketConnected()'
    uiLogger.i(logTag, 'called')
  }

  /**
   * implement IHwControl
   * 웹소켓 클라이언트가 연결되었고,
   * 디바이스(serial)가 CLOSE 되기 전에 한번 호출됩니다
   */
  onWebSocketDisconnected = async (ctx: any): Promise<void> => {
    const logTag = 'WiseXboardPremiumControl.onWebSocketDisconnected()'
    uiLogger.i(logTag, 'called')

    // 모터 중지
    try {
      await this.stopDCMotorP(ctx)
    } catch (err) {}

    // 모든 LED OFF
    try {
      for (let i = 0; i < 7; i++) {
        await this.digitalWriteP(ctx, i, 0)
      }
    } catch (ignore) {}
  }
}
