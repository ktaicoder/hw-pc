import { uiLogger } from 'src/services/hw/UiLogger'
import { AbstractHwConrtol } from '../AbstractHwControl'
import { IUamVertiPortControl } from './IUamVertiPortControl'

const DEBUG = false

/**
 * 하드웨어 서비스
 */
export class UamVertiPortControl extends AbstractHwConrtol implements IUamVertiPortControl {
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
        if (
          msg.includes('checksum mismatch') ||
          msg.includes('check delimiter') ||
          msg.includes('invalid line')
        ) {
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

    const buf = [Constants.START_DELIMETER, 5, Constants.CMD_DC_MOTOR_ALL_ON, l1, r1, l2, r2, 0]
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

    const buf = [Constants.START_DELIMETER, 3, Constants.CMD_DC_MOTOR_1_ON, l1, r1, 0]
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

    const buf = [Constants.START_DELIMETER, 3, Constants.CMD_DC_MOTOR_2_ON, l2, r2, 0]
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
    const pkt = [Constants.START_DELIMETER, 1, Constants.CMD_DC_MOTOR_OFF, 0]
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
  async setServoMotorAngleP(ctx: any, pinNum: number, angle: number, speed: number): Promise<void> {
    if (angle < -90) angle = -90
    if (angle > 90) angle = 90
    if (angle < 0) angle = 255 + angle

    // 기존에 속도값은 전달하지 않는다
    // if (speed > 30) speed = 30
    // if (speed < 1) speed = 1
    //const speed = 20

    if (pinNum < 3) pinNum = 3
    if (pinNum > 6) pinNum = 6

    let cksum = 0
    const buf = [Constants.START_DELIMETER, 4, Constants.CMD_SERVO_MOTOR, pinNum, angle, speed, 0]
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
    const buf = [Constants.START_DELIMETER, 3, Constants.CMD_GPIO_OUT, pinNum, value, 0]
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
    const buf = [Constants.START_DELIMETER, 2, Constants.CMD_IN_KEYBOARD, key, 0]
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    await this.write_(ctx, buf)
  }
  /**
   * IoT 키트 점검
   */
  async inspectionKit(ctx: any): Promise<void> {
    this.digitalWriteP(ctx, 0, 1)
    this.digitalWriteP(ctx, 1, 1)
    await this.delay(500)
    this.digitalWriteP(ctx, 0, 0)
    this.digitalWriteP(ctx, 1, 0)
    await this.delay(500)
    this.setDCMotor1SpeedP(ctx, 100, 100)
    await this.delay(500)
    this.setDCMotor1SpeedP(ctx, 0, 0)
    await this.delay(500)
    this.setDCMotor1SpeedP(ctx, -100, -100)
    await this.delay(500)
    this.setDCMotor1SpeedP(ctx, 0, 0)
    await this.delay(500)
    this.setServoMotorAngleP(ctx, 3, 90, 20)
    this.setServoMotorAngleP(ctx, 4, 90, 20)
    this.setServoMotorAngleP(ctx, 5, 90, 20)
    await this.delay(500)
    this.setServoMotorAngleP(ctx, 3, -90, 20)
    this.setServoMotorAngleP(ctx, 4, -90, 20)
    this.setServoMotorAngleP(ctx, 5, -90, 20)
    await this.delay(500)
    this.setServoMotorAngleP(ctx, 3, 0, 20)
    this.setServoMotorAngleP(ctx, 4, 0, 20)
    this.setServoMotorAngleP(ctx, 5, 0, 20)
    await this.delay(500)
  }

  /**
   * 디바이스(serial)에 연결된 직후에 자동으로 호출됩니다
   */
  onDeviceOpened = async (ctx: any): Promise<void> => {
    const logTag = 'RossiMetaControl.onDeviceOpened()'
    uiLogger.i(logTag, 'called')
  }

  /**
   * 디바이스(serial)가 닫히기 전에 자동으로 호출됩니다
   */
  onDeviceWillClose = async (ctx: any): Promise<void> => {
    const logTag = 'RossiMetaControl.onDeviceWillClose()'
    uiLogger.i(logTag, 'called')
  }

  /**
   * implement IHwControl
   * 웹소켓 클라이언트가 연결되었고,
   * 시리얼 장치가 OPEN 된 후에 한번 호출됩니다
   */
  onWebSocketConnected = async (ctx: any): Promise<void> => {
    const logTag = 'RossiMetaControl.onWebSocketConnected()'
    uiLogger.i(logTag, 'called')
  }

  /**
   * implement IHwControl
   * 웹소켓 클라이언트가 연결되었고,
   * 디바이스(serial)가 CLOSE 되기 전에 한번 호출됩니다
   */
  onWebSocketDisconnected = async (ctx: any): Promise<void> => {
    const logTag = 'RossiMetaControl.onWebSocketDisconnected()'
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
  delay(ms: number): Promise<any> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
namespace Constants {
  // 명령어 리스트
  export const START_DELIMETER: number = 0x23
  export const CMD_GPIO_OUT: number = 0x80
  export const CMD_SERVO_MOTOR: number = 0x81
  export const CMD_DC_MOTOR_ALL_ON: number = 0x82
  export const CMD_DC_MOTOR_OFF: number = 0x83
  export const CMD_IN_KEYBOARD: number = 0x84
  export const CMD_DC_MOTOR_1_ON: number = 0x85
  export const CMD_DC_MOTOR_2_ON: number = 0x86

  //BLOCK CMD
  export const CMD_FLOW_COND_NUM: number = 0xb0
  export const CMD_FLOW_COND_IF: number = 0xb1
  export const CMD_FLOW_COND_IF_START: number = 0xb2
  export const CMD_FLOW_COND_ELSE_START: number = 0xb3
  export const CMD_FLOW_COND_IF_END: number = 0xb4
  export const CMD_FLOW_LOOP_COND_START: number = 0xb5
  export const CMD_FLOW_LOOP_COND_END: number = 0xb6
  export const CMD_FLOW_LOOP_START: number = 0xb7
  export const CMD_FLOW_LOOP_END: number = 0xb8
  export const CMD_FLOW_LOOP_CNT_START: number = 0xb9
  export const CMD_FLOW_LOOP_CNT_END: number = 0xba
  export const CMD_FLOW_LOOP_DELAY_SEC: number = 0xbb
  export const CMD_FLOW_WRITE_VARIABLE: number = 0xbc
  export const CMD_FLOW_READ_VARIABLE: number = 0xbd
  export const CMD_FLOW_SET_VARIABLE: number = 0xbe
  export const CMD_IOT_SERVO_MOTOR_ANGLE_VALUE: number = 0xbf
  export const CMD_FLOW_LOOP_BREAK_CONTINUE: number = 0xc0
  export const CMD_FLOW_JGMT_SIGN: number = 0xc1
  export const CMD_FLOW_JGMT_BOOL: number = 0xc2
  export const CMD_FLOW_JGMT_LOGIC: number = 0xc3
  export const CMD_IOT_READ_REMOTE: number = 0xc4
  export const CMD_IOT_DC_MOTOR_OFF: number = 0xc5
  export const CMD_IOT_DC_MOTOR_SPEED: number = 0xc6
  export const CMD_IOT_SERVO_MOTOR_ANGLE: number = 0xc7
  export const CMD_IOT_DIGIT_OUTPUT: number = 0xc8
  export const CMD_IOT_ANALOG_INPUT: number = 0xc9
  export const CMD_IOT_DIGIT_INPUT: number = 0xca
  export const CMD_IOT_DC_MOTOR_1_ON: number = 0xcb
  export const CMD_IOT_DC_MOTOR_2_ON: number = 0xcc
  export const CMD_IOT_DC_ALL_MOTOR_VALUE: number = 0xcd
  export const CMD_IOT_DC_MOTOR_1_VALUE: number = 0xce
  export const CMD_IOT_DC_MOTOR_2_VALUE: number = 0xcf
  export const CMD_BLOCK_SAVE_START: number = 0xd0
  export const CMD_BLOCK_SAVE_END: number = 0xd1
}
