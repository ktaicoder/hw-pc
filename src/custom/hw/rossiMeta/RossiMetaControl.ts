import { uiLogger } from 'src/services/hw/UiLogger'
import { AbstractHwConrtol } from '../AbstractHwControl'
import { IRossiMetaControl } from './IRossiMetaControl'

const DEBUG = false

/**
 * 하드웨어 서비스
 */
export class RossiMetaControl extends AbstractHwConrtol implements IRossiMetaControl {
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
   * 흐름조건 블록 숫자
   * @param ctx - 디바이스
   * @param value - 숫자 값
   */
  async blockFlowNumber(ctx: any, value: number): Promise<string> {
    let cksum = 0
    const buf = [Constants.START_DELIMETER, 2, Constants.CMD_FLOW_COND_NUM, value, 0]
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    let rst: number[][] = []
    rst.push(buf)
    return JSON.stringify(Array.from(rst.entries()))
  }

  /**
   * 변수 1 쓰기
   * @param ctx - 디바이스
   * @param index - 변수 번호
   * @param payload - 인자
   */
  async blockFlowWriteVariable(ctx: any, index: number, payload: string): Promise<void> {
    let cksum = 0
    const buf = [Constants.START_DELIMETER, 2, Constants.CMD_FLOW_WRITE_VARIABLE, index, 0]
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    await this.write_(ctx, buf)
    if (payload != null) {
      let array = JSON.parse(payload)
      for (let item of array) {
        let value = item[1]
        await this.delay(100)
        await this.write_(ctx, value)
      }
    }
  }

  async blockFlowSetVariable(
    ctx: any,
    index: number,
    value: number,
    operation: number,
  ): Promise<void> {
    let cksum = 0
    const buf = [
      Constants.START_DELIMETER,
      4,
      Constants.CMD_FLOW_SET_VARIABLE,
      index,
      value,
      operation,
      0,
    ]
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    await this.write_(ctx, buf)
  }

  async blockFlowReadVariable(ctx: any, index: number): Promise<string> {
    let cksum = 0
    const buf = [Constants.START_DELIMETER, 2, Constants.CMD_FLOW_READ_VARIABLE, index, 0]
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum

    let rst: number[][] = []
    rst.push(buf)
    return JSON.stringify(Array.from(rst.entries()))
  }

  /**
   * 흐름조건 블록 만약
   * @param ctx - 디바이스
   * @param payload - 인자로 받은 명령어 맵
   */
  async blockFlowIf(ctx: any, payload: string): Promise<void> {
    let cksum = 0
    const buf = [Constants.START_DELIMETER, 1, Constants.CMD_FLOW_COND_IF, 0]
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum

    await this.write_(ctx, buf)
    if (payload != null) {
      let array = JSON.parse(payload)
      for (let item of array) {
        let value = item[1]
        await this.delay(100)
        await this.write_(ctx, value)
      }
    }
    await this.blockFlowIfStart(ctx)
  }

  /**
   * 흐름조건 블록 하기 시작
   * @param ctx - 디바이스
   */
  async blockFlowIfStart(ctx: any): Promise<void> {
    let cksum = 0
    const buf = [Constants.START_DELIMETER, 1, Constants.CMD_FLOW_COND_IF_START, 0]
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    await this.write_(ctx, buf)
  }

  /**
   * 흐름조건 블록 하기 시작
   * @param ctx - 디바이스
   */
  async blockFlowElseStart(ctx: any): Promise<void> {
    let cksum = 0
    const buf = [Constants.START_DELIMETER, 1, Constants.CMD_FLOW_COND_ELSE_START, 0]
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    await this.write_(ctx, buf)
  }

  /**
   * 흐름조건 블록 하기 끝
   * @param ctx - 디바이스
   */
  async blockFlowIfEnd(ctx: any): Promise<void> {
    let cksum = 0
    const buf = [Constants.START_DELIMETER, 1, Constants.CMD_FLOW_COND_IF_END, 0]
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    await this.write_(ctx, buf)
  }

  /**
   * 흐름반복 블록 조건이?이라면 반복하기 시작
   * @param ctx - 디바이스
   * @param payload - 페이로드
   */
  async blockFlowLoopCondStart(ctx: any, payload: string): Promise<void> {
    let cksum = 0
    const buf = [Constants.START_DELIMETER, 1, Constants.CMD_FLOW_LOOP_COND_START, 0]
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    await this.write_(ctx, buf)
    if (payload != null) {
      let array = JSON.parse(payload)
      for (let item of array) {
        let value = item[1]
        await this.delay(100)
        await this.write_(ctx, value)
      }
    }
  }

  /**
   * 흐름반복 블록 조건이?라면 반봅하기 끝
   * @param ctx - 디바이스
   */
  async blockFlowLoopCondEnd(ctx: any): Promise<void> {
    let cksum = 0
    const buf = [Constants.START_DELIMETER, 1, Constants.CMD_FLOW_LOOP_COND_END, 0]
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    await this.write_(ctx, buf)
  }

  /**
   * 흐름반복 블록 무한반복 시작
   * @param ctx - 디바이스
   */
  async blockFlowLoopStart(ctx: any): Promise<void> {
    let cksum = 0
    const buf = [Constants.START_DELIMETER, 1, Constants.CMD_FLOW_LOOP_START, 0]
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    await this.write_(ctx, buf)
  }

  /**
   * 흐름반복 블록 무한반복 끝
   * @param ctx - 디바이스
   */
  async blockFlowLoopEnd(ctx: any): Promise<void> {
    let cksum = 0
    const buf = [Constants.START_DELIMETER, 1, Constants.CMD_FLOW_LOOP_END, 0]
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    await this.write_(ctx, buf)
  }

  /**
   * 흐름반복 블록 N회 반복 시작
   * @param ctx - 디바이스
   * @param count - N회
   */
  async blockFlowLoopCntStart(ctx: any, count: number): Promise<void> {
    let cksum = 0
    const buf = [Constants.START_DELIMETER, 2, Constants.CMD_FLOW_LOOP_CNT_START, count, 0]
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    await this.write_(ctx, buf)
  }

  /**
   * 흐름반복 블록 N회 반복 끝
   * @param ctx - 디바이스
   */
  async blockFlowLoopCntEnd(ctx: any): Promise<void> {
    let cksum = 0
    const buf = [Constants.START_DELIMETER, 1, Constants.CMD_FLOW_LOOP_CNT_END, 0]
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    await this.write_(ctx, buf)
  }

  /**
   * 흐름반복 블록 멈추기 N초
   * @param ctx - 디바이스
   * @param sec - N초 (2bytes)
   * @param type - 0: 밀리초, 1: 초
   */
  async blockFlowLoopDelaySec(ctx: any, sec: number, type: number): Promise<void> {
    let cksum = 0
    const buf = [
      Constants.START_DELIMETER,
      4,
      Constants.CMD_FLOW_LOOP_DELAY_SEC,
      type,
      sec & 0xff,
      (sec >> 8) & 0xff,
      0,
    ]
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    await this.write_(ctx, buf)
  }

  /**
   * 흐름반복 블록 반복 중단
   * @param ctx - 디바이스
   * @param value = 0: break(반복중단), 1: continue(다음반복)
   */
  async blockFlowLoopBreakContinue(ctx: any, value: number): Promise<void> {
    let cksum = 0
    const buf = [Constants.START_DELIMETER, 2, Constants.CMD_FLOW_LOOP_BREAK_CONTINUE, value, 0]
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    await this.write_(ctx, buf)
  }

  /**
   * 흐름판단 블록 등호, 부등호
   * @param ctx - 디바이스
   * @param left - 왼쪽 JSON
   * @param right - 오른쪽 JSON
   * @param sign - 등호,부등호 구분자
   */
  async blockFlowLoopJgmtSign(
    ctx: any,
    left: string,
    right: string,
    sign: number,
  ): Promise<string> {
    let cksum = 0
    const buf = [Constants.START_DELIMETER, 2, Constants.CMD_FLOW_JGMT_SIGN, sign, 0]
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    let rst: number[][] = []
    rst.push(buf)

    if (left != null) {
      let array = JSON.parse(left)
      for (let item of array) {
        let value = item[1]
        let str: string = 'Make Left Buf: '
        for (let i = 0; i < value.length; i++) {
          str += value[i].toString(16).toUpperCase().padStart(2, '0') + ' '
        }
        console.log(str)
        rst.push(value)
      }
    }

    if (right != null) {
      let array = JSON.parse(right)
      for (let item of array) {
        let value = item[1]
        let str: string = 'Make Right Buf: '
        for (let i = 0; i < value.length; i++) {
          str += value[i].toString(16).toUpperCase().padStart(2, '0') + ' '
        }
        console.log(str)
        rst.push(value)
      }
    }

    return JSON.stringify(Array.from(rst.entries()))
  }

  /**
   * 흐름판단 블록 참, 거짓
   * @param ctx - 디바이스
   * @param value = 0: false, 1: true
   */
  async blockFlowLoopJgmtBool(ctx: any, value: number): Promise<string> {
    let cksum = 0
    const buf = [Constants.START_DELIMETER, 2, Constants.CMD_FLOW_JGMT_BOOL, value, 0]
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum

    let rst: number[][] = []
    rst.push(buf)
    return JSON.stringify(Array.from(rst.entries()))
  }

  /**
   * 흐름판단 블록 로직
   * @param ctx - 디바이스
   * @param left
   * @param right
   * @param logic
   */
  async blockFlowLoopJgmtLogic(
    ctx: any,
    left: string,
    right: string,
    logic: number,
  ): Promise<string> {
    let cksum = 0
    const buf = [Constants.START_DELIMETER, 2, Constants.CMD_FLOW_JGMT_LOGIC, logic, 0]
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    let rst: number[][] = []
    rst.push(buf)

    if (left != null) {
      let array = JSON.parse(left)
      for (let item of array) {
        let value = item[1]
        let str: string = 'Make Left Buf: '
        for (let i = 0; i < value.length; i++) {
          str += value[i].toString(16).toUpperCase().padStart(2, '0') + ' '
        }
        console.log(str)
        rst.push(value)
      }
    }

    if (right != null) {
      let array = JSON.parse(right)
      for (let item of array) {
        let value = item[1]
        let str: string = 'Make Right Buf: '
        for (let i = 0; i < value.length; i++) {
          str += value[i].toString(16).toUpperCase().padStart(2, '0') + ' '
        }
        console.log(str)
        rst.push(value)
      }
    }

    console.log('Size of rst: ' + rst.length)
    rst.forEach((value, key) => {
      let str: string = 'Key: ' + key.toString(16).toUpperCase().padStart(2, '0') + ', Value: '
      for (let i = 0; i < value.length; i++) {
        str += value[i].toString(16).toUpperCase().padStart(2, '0') + ' '
      }
      console.log(str)
    })
    return JSON.stringify(Array.from(rst.entries()))
  }

  /**
   * IoT Kit 리모컨 값 읽기
   * @param ctx - 디바이스
   */
  async blockIotKitReadRemote(ctx: any): Promise<string> {
    let cksum = 0
    const buf = [Constants.START_DELIMETER, 1, Constants.CMD_IOT_READ_REMOTE, 0]
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    let rst: number[][] = []
    rst.push(buf)
    return JSON.stringify(Array.from(rst.entries()))
  }

  /**
   * IoT Kit 모든 DC모터 끄기
   * @param ctx - 디바이스
   */
  async blockIotKitOffAllDCMotor(ctx: any): Promise<void> {
    let cksum = 0
    const buf = [Constants.START_DELIMETER, 1, Constants.CMD_IOT_DC_MOTOR_OFF, 0]
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    await this.write_(ctx, buf)
  }

  /**
   * IoT Kit 모든 모터 속도 조절
   * @param ctx - 디바이스
   * @param l1 - 모터1 왼쪽
   * @param r1 - 모터1 오른쪽
   * @param l2 - 모터2 왼쪽
   * @param r2 - 모터2 오른쪽
   */
  async blockIotKitAllMotorSpeed(
    ctx: any,
    l1: number,
    l2: number,
    r1: number,
    r2: number,
  ): Promise<void> {
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

    const buf = [Constants.START_DELIMETER, 5, Constants.CMD_IOT_DC_MOTOR_SPEED, l1, l2, r1, r2, 0]
    let cksum = 0
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    await this.write_(ctx, buf)
  }
  /**
   * IoT Kit 모든 모터 속도 조절
   * @param ctx - 디바이스
   * @param l1 - 모터1 왼쪽
   * @param r1 - 모터1 오른쪽
   * @param l2 - 모터2 왼쪽
   * @param r2 - 모터2 오른쪽
   */
  async blockIotKitAllMotorSpeedValue(
    ctx: any,
    l1: string,
    l2: string,
    r1: string,
    r2: string,
  ): Promise<void> {
    const buf = [Constants.START_DELIMETER, 1, Constants.CMD_IOT_DC_ALL_MOTOR_VALUE, 0]
    let cksum = 0
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    await this.write_(ctx, buf)

    if (l1 != null) {
      let array = JSON.parse(l1)
      for (let item of array) {
        let value = item[1]
        await this.delay(100)
        await this.write_(ctx, value)
      }
    }
    if (l2 != null) {
      let array = JSON.parse(l2)
      for (let item of array) {
        let value = item[1]
        await this.delay(100)
        await this.write_(ctx, value)
      }
    }
    if (r1 != null) {
      let array = JSON.parse(r1)
      for (let item of array) {
        let value = item[1]
        await this.delay(100)
        await this.write_(ctx, value)
      }
    }
    if (r2 != null) {
      let array = JSON.parse(r2)
      for (let item of array) {
        let value = item[1]
        await this.delay(100)
        await this.write_(ctx, value)
      }
    }
  }
  /**
   * IoT Kit n번 서버모터 각도를 N으로 정하기
   * @param ctx - 디바이스
   * @param pinNum - n번 핀 번호
   * @param speed - 속도
   * @param angle - N각도
   */
  async blockIotKitServoMotor(
    ctx: any,
    pinNum: number,
    angle: number,
    speed: number,
  ): Promise<void> {
    if (angle < -90) angle = -90
    if (angle > 90) angle = 90
    if (angle < 0) angle = 255 + angle

    if (pinNum < 3) pinNum = 3
    if (pinNum > 6) pinNum = 6

    let cksum = 0
    const buf = [
      Constants.START_DELIMETER,
      4,
      Constants.CMD_IOT_SERVO_MOTOR_ANGLE,
      pinNum,
      angle,
      speed,
      0,
    ]
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    await this.write_(ctx, buf)
  }

  /**
   * IoT Kit 디지털 n번 핀 N으로 정하기
   * @param ctx - 디바이스
   * @param pinNum - n번 핀 번호
   * @param value - N으로 설정
   */
  async blockIotKitDigitalOutput(ctx: any, pinNum: number, value: number): Promise<void> {
    value = value <= 0 ? 0 : 1
    pinNum = pinNum <= 0 ? 0 : pinNum >= 5 ? 5 : pinNum
    if (DEBUG) console.log(`digitalWriteP : pinNo: ${pinNum}, value:${value}`)

    let cksum = 0
    const buf = [Constants.START_DELIMETER, 3, Constants.CMD_IOT_DIGIT_OUTPUT, pinNum, value, 0]
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    await this.write_(ctx, buf)
  }

  /**
   * IoT Kit 아날로그 n번 핀 읽기
   * @param ctx - 디바이스
   * @param pin - n번 핀
   */
  async blockIotKitAnalogInput(ctx: any, pin: number): Promise<string> {
    let cksum = 0
    const buf = [Constants.START_DELIMETER, 2, Constants.CMD_IOT_ANALOG_INPUT, pin - 1, 0]
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    let rst: number[][] = []
    rst.push(buf)
    return JSON.stringify(Array.from(rst.entries()))
  }

  /**
   * IoT Kit 디지털 n번 핀 읽기
   * @param ctx - 디바이스
   * @param pin - n번 핀
   */
  async blockIotKitDigitalInput(ctx: any, pin: number): Promise<string> {
    let cksum = 0
    const buf = [Constants.START_DELIMETER, 2, Constants.CMD_IOT_DIGIT_INPUT, pin - 1, 0]
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    let rst: number[][] = []
    rst.push(buf)
    return JSON.stringify(Array.from(rst.entries()))
  }

  /**
   * IoT Kit DC모터1 속도 조절
   * @param ctx - 디바이스
   * @param l1 - 모터1 왼쪽 속도
   * @param r1 - 모터1 오른쪽 속도
   */
  async blockIotKitDCMotor1(ctx: any, l1: number, r1: number): Promise<void> {
    if (l1 < -100) l1 = -100
    if (r1 < -100) r1 = -100
    if (l1 > 100) l1 = 100
    if (r1 > 100) r1 = 100
    if (l1 < 0) l1 = 256 + l1
    if (r1 < 0) r1 = 256 + r1

    const buf = [Constants.START_DELIMETER, 3, Constants.CMD_IOT_DC_MOTOR_1_ON, l1, r1, 0]
    let cksum = 0
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    await this.write_(ctx, buf)
  }
  /**
   * IoT Kit DC모터1 속도 조절
   * @param ctx - 디바이스
   * @param l1 - 모터1 왼쪽 속도
   * @param r1 - 모터1 오른쪽 속도
   */
  async blockIotKitDCMotor1Value(ctx: any, l1: string, r1: string): Promise<void> {
    const buf = [Constants.START_DELIMETER, 1, Constants.CMD_IOT_DC_MOTOR_1_VALUE, 0]
    let cksum = 0
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    await this.write_(ctx, buf)
    if (l1 != null) {
      let array = JSON.parse(l1)
      for (let item of array) {
        let value = item[1]
        await this.delay(100)
        await this.write_(ctx, value)
      }
    }
    if (r1 != null) {
      let array = JSON.parse(r1)
      for (let item of array) {
        let value = item[1]
        await this.delay(100)
        await this.write_(ctx, value)
      }
    }
  }
  /**
   * IoT Kit DC모터2 속도 조절
   * @param ctx - 디바이스
   * @param l2 - 모터1 왼쪽 속도
   * @param r2 - 모터1 오른쪽 속도
   */
  async blockIotKitDCMotor2(ctx: any, l2: number, r2: number): Promise<void> {
    if (l2 < -100) l2 = -100
    if (r2 < -100) r2 = -100
    if (l2 > 100) l2 = 100
    if (r2 > 100) r2 = 100
    if (l2 < 0) l2 = 256 + l2
    if (r2 < 0) r2 = 256 + r2

    const buf = [Constants.START_DELIMETER, 3, Constants.CMD_IOT_DC_MOTOR_2_ON, l2, r2, 0]
    let cksum = 0
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    await this.write_(ctx, buf)
  }
  /**
   * IoT Kit DC모터2 속도 조절
   * @param ctx - 디바이스
   * @param l2 - 모터1 왼쪽 속도
   * @param r2 - 모터1 오른쪽 속도
   */
  async blockIotKitDCMotor2Value(ctx: any, l2: string, r2: string): Promise<void> {
    const buf = [Constants.START_DELIMETER, 1, Constants.CMD_IOT_DC_MOTOR_2_VALUE, 0]
    let cksum = 0
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    await this.write_(ctx, buf)
    if (l2 != null) {
      let array = JSON.parse(l2)
      for (let item of array) {
        let value = item[1]
        await this.delay(100)
        await this.write_(ctx, value)
      }
    }
    if (r2 != null) {
      let array = JSON.parse(r2)
      for (let item of array) {
        let value = item[1]
        await this.delay(100)
        await this.write_(ctx, value)
      }
    }
  }
  async blockIotKitServoMotorValue(
    ctx: any,
    pinNum: number,
    angle: string,
    speed: string,
  ): Promise<void> {
    if (pinNum < 3) pinNum = 3
    if (pinNum > 6) pinNum = 6

    let cksum = 0
    const buf = [Constants.START_DELIMETER, 2, Constants.CMD_IOT_SERVO_MOTOR_ANGLE_VALUE, pinNum, 0]
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    await this.write_(ctx, buf)
    if (angle != null) {
      let array = JSON.parse(angle)
      for (let item of array) {
        let value = item[1]
        await this.delay(100)
        await this.write_(ctx, value)
      }
    }
    if (speed != null) {
      let array = JSON.parse(speed)
      for (let item of array) {
        let value = item[1]
        await this.delay(100)
        await this.write_(ctx, value)
      }
    }
  }
  /**
   * IoT Kit 블록 Map 저장 시작
   * @param ctx - 디바이스
   * @param num - 저장번호
   */
  async blockSaveStart(ctx: any, num: number): Promise<void> {
    let cksum = 0
    const buf = [Constants.START_DELIMETER, 2, Constants.CMD_BLOCK_SAVE_START, num, 0]
    for (let i = 2; i < buf.length - 1; i++) {
      cksum ^= buf[i]
    }
    buf[buf.length - 1] = cksum
    await this.write_(ctx, buf)
  }

  /**
   * IoT Kit 블록 Map 저장 끝
   * @param ctx - 디바이스
   */
  async blockSaveEnd(ctx: any): Promise<void> {
    let cksum = 0
    const buf = [Constants.START_DELIMETER, 1, Constants.CMD_BLOCK_SAVE_END, 0]
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
