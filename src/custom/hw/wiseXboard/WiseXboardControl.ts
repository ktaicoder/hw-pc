import { IUiLogger } from 'src/custom-types'
import { filter, firstValueFrom, map, take } from 'rxjs'
import { SerialDevice } from 'src/hw-server/serialport/SerialDevice'
import { IWiseXboardControl } from './IWiseXboardControl'

const DEBUG = false

const chr = (ch: string): number => ch.charCodeAt(0)

/**
 * 하드웨어 제어
 */
export class WiseXboardControl implements IWiseXboardControl {
  /**
   * 연결된 디바이스(serial)
   */
  private device_ = (ctx: any): SerialDevice => {
    const { device } = ctx
    return device as SerialDevice
  }

  /**
   * PC 프로그램의 콘솔 로거
   */
  private log = (ctx: any): IUiLogger => {
    const { uiLogger } = ctx
    return uiLogger as IUiLogger
  }

  /**
   * 디바이스(serial)에 write
   */
  private write_ = async (ctx: any, values: Buffer | number[]): Promise<void> => {
    const device = this.device_(ctx)
    await device.write(values)
  }

  /**
   * 디바이스(serial)로부터 읽기
   */
  private readNext_ = (ctx: any): Promise<Buffer> => {
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

  private sendPacketMRTEXE = async (ctx: any, exeIndex: number): Promise<void> => {
    const pkt = [0xff, 0xff, 0x4c, 0x53, 0, 0, 0, 0, 0x30, 0x0c, 0x03, exeIndex, 0, 100, 0]
    for (let i = 6; i < 14; i++) {
      pkt[14] += pkt[i]
    }
    await this.write_(ctx, pkt)
  }

  analogRead = async (ctx: any, pin: 1 | 2 | 3 | 4 | 5): Promise<number> => {
    const values = await this.readNext_(ctx)
    // [pin1 ~ pin5]
    // return Array.prototype.slice.call(values, 0, 5)
    const v = values[pin - 1]
    return v ?? 0
  }

  digitalRead = async (ctx: any, pin: 1 | 2 | 3 | 4 | 5): Promise<number> => {
    const values = await this.readNext_(ctx)
    // [pin1 ~ pin5]
    const v = values[pin - 1]
    return v > 100 ? 1 : 0
  }

  digitalWrite = async (ctx: any, pin: 1 | 2 | 3 | 4 | 5, value: number): Promise<void> => {
    value = value > 0 ? 1 : 0

    const pkt = [chr('X'), chr('R'), 2, 0, 0, 0, 0, 0, chr('S')]
    pkt[2 + pin] = value
    await this.write_(ctx, pkt)
  }

  setHumanoidMotion = async (ctx: any, index: number): Promise<void> => {
    const pkt = [0xff, 0xff, 0x4c, 0x53, 0, 0, 0, 0, 0x30, 0x0c, 0x03, index, 0, 100, 0]
    for (let i = 6; i < 14; i++) {
      pkt[14] += pkt[i]
    }
    await this.write_(ctx, pkt)
  }

  stopDCMotor = async (ctx: any): Promise<void> => {
    const pkt = [chr('X'), chr('R'), 0, 0, 0, 0, 0, 0, chr('S')]
    await this.write_(ctx, pkt)
    await this.sendPacketMRTEXE(ctx, 2)
  }

  /**
   * 모터 속도 L1,R1,L2,R2 정하기
   * @param l1
   * @param r1
   * @param l2
   * @param r2
   */
  setDCMotorSpeed = async (ctx: any, l1: number, r1: number, l2: number, r2: number): Promise<void> => {
    if (l1 < -10) l1 = -10
    if (r1 < -10) r1 = -10
    if (l2 > 10) l2 = 10
    if (r2 > 10) r2 = 10

    if (l1 < 0) l1 = 256 + l1
    if (l2 < 0) l2 = 256 + l2
    if (r1 < 0) r1 = 256 + r1
    if (r2 < 0) r2 = 256 + r2

    await this.write_(ctx, [chr('X'), chr('R'), 0, l1, r1, l2, r2, 0, chr('S')])
    await this.sendPacketMRTEXE(ctx, 2)
  }

  // pinNo = [1,5]
  setServoMotorAngle = async (ctx: any, pinNum: number, angle: number): Promise<void> => {
    if (angle < -90) angle = -90
    if (angle > 90) angle = 90
    if (angle < 0) angle = 255 + angle

    if (pinNum < 1) pinNum = 1
    if (pinNum > 5) pinNum = 5

    await this.write_(ctx, [chr('X'), chr('R'), 3, pinNum, angle, 0, 0, 0, chr('S')])
    await this.sendPacketMRTEXE(ctx, 2)
  }

  onDeviceOpened = async (ctx: any): Promise<void> => {
    const logTag = 'WiseXboardControl.onDeviceOpened()'
    this.log(ctx).i(logTag, 'called')
  }

  onDeviceWillClose = async (ctx: any): Promise<void> => {
    const logTag = 'WiseXboardControl.onDeviceWillClose()'
    this.log(ctx).i(logTag, 'called')
  }

  /**
   * 웹소켓 클라이언트가 연결되었고,
   * 시리얼 장치가 OPEN 된 후에 한번 호출됩니다
   */
  onWebSocketConnected = async (ctx: any): Promise<void> => {
    const logTag = 'WiseXboardControl.onWebSocketConnected()'
    this.log(ctx).i(logTag, 'called')
  }

  /**
   * 클라이언트의 연결이 종료되었을 때,
   * 자동으로 호출해준다.
   */
  onWebSocketDisconnected = async (ctx: any): Promise<void> => {
    const logTag = 'WiseXboardControl.onWebSocketDisconnected()'
    this.log(ctx).i(logTag, 'called')

    // 모터 중지
    try {
      await this.stopDCMotor(ctx)
    } catch (err) {}

    try {
      // 모든 LED OFF
      // 아무핀에나 0을 쓰면 모두 0이 된다.
      await this.digitalWrite(ctx, 1, 0)
    } catch (ignore) {}
  }
}
