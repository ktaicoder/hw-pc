import SerialPort, { parsers } from 'serialport'
import { IHwContext, ISerialPortInfo, SerialPortHelper } from 'src/custom-types'
import { IWiseXboardControl } from './IWiseXboardControl'

const DEBUG = false

const DELIMITER = Buffer.from([0x52, 0x58, 0x3d, 0x0, 0x0e])

const chr = (ch: string): number => ch.charCodeAt(0)

/**
 * 하드웨어 제어
 */
export class WiseXboardControl implements IWiseXboardControl {
  private _context: IHwContext | null = null

  /**
   * 하드웨어 컨텍스트
   * 프레임워크에서 Injection 해준다.
   * @param context
   */
  setContext = (context: IHwContext | undefined | null) => {
    this._context = context ?? null
  }

  /**
   * 시리얼포트 헬퍼 생성
   * 프레임워크에서 호출한다.
   * @param path 시리얼포트 패스(ex: COM1, /dev/ttyUSB0, ...)
   * @returns SerialPortHelper
   */
  static createSerialPortHelper = (path: string): SerialPortHelper => {
    const sp = new SerialPort(path, {
      autoOpen: false,
      baudRate: 38400,
      lock: false,
    })

    const parser = new parsers.Delimiter({ delimiter: DELIMITER, includeDelimiter: false })
    return SerialPortHelper.create(sp, parser)
  }

  /**
   * 시리얼포트를 처리할 수 있는지 체크
   * @param portInfo
   * @returns
   */
  static isMatch = (portInfo: ISerialPortInfo): boolean => {
    if (portInfo.manufacturer) {
      return portInfo.manufacturer.includes('Silicon Labs')
    }
    return false
  }

  private getSerialPortHelper(): SerialPortHelper | undefined {
    return this._context?.provideSerialPortHelper?.()
  }

  /**
   * @override IHwControl
   * @returns 읽기 가능 여부
   */
  isReadable = (): boolean => {
    const sp = this.getSerialPortHelper()
    return sp?.isReadable() === true
  }

  private checkSerialPort(): SerialPortHelper {
    if (!this.isReadable()) {
      throw new Error('hw not open')
    }
    return this.getSerialPortHelper()!
  }

  private async sendPacketMRTEXE(exeIndex: number) {
    const helper = this.checkSerialPort()
    const pkt = [0xff, 0xff, 0x4c, 0x53, 0, 0, 0, 0, 0x30, 0x0c, 0x03, exeIndex, 0, 100, 0]
    for (let i = 6; i < 14; i++) {
      pkt[14] += pkt[i]
    }
    await helper.write(pkt)
  }

  async analogRead(): Promise<number[]> {
    const helper = this.checkSerialPort()
    const values = await helper.readNext()

    // [pin1 ~ pin5]
    return new Array(5).fill(0).map((_, i) => values[i] ?? 0)
  }

  async digitalRead(): Promise<number[]> {
    const values = await this.analogRead()
    // [pin1 ~ pin5]
    return values.map((v) => (v > 100 ? 1 : 0))
  }

  async digitalWrite(pin: 1 | 2 | 3 | 4 | 5, value: number): Promise<void> {
    const helper = this.checkSerialPort()
    value = value > 0 ? 1 : 0

    const pkt = [chr('X'), chr('R'), 2, 0, 0, 0, 0, 0, chr('S')]
    pkt[2 + pin] = value
    if (DEBUG) console.log(`digitalWrite: pin=${pin}, value=${value}`)
    await helper.write(pkt)
  }

  async setHumanoidMotion(index: number): Promise<void> {
    const helper = this.checkSerialPort()
    const pkt = [0xff, 0xff, 0x4c, 0x53, 0, 0, 0, 0, 0x30, 0x0c, 0x03, index, 0, 100, 0]
    for (let i = 6; i < 14; i++) {
      pkt[14] += pkt[i]
    }
    await helper.write(pkt)
  }

  async stopDCMotor(): Promise<void> {
    const helper = this.checkSerialPort()
    const pkt = [chr('X'), chr('R'), 0, 0, 0, 0, 0, 0, chr('S')]
    await helper.write(pkt)
    await this.sendPacketMRTEXE(2)
  }

  /**
   * 모터 속도 L1,R1,L2,R2 정하기
   * @param l1
   * @param r1
   * @param l2
   * @param r2
   */
  async setDCMotorSpeed(l1: number, r1: number, l2: number, r2: number): Promise<void> {
    if (DEBUG) console.log(`setDCMotorSpeed : l1: ${l1}, r1:${r1}, l2:${l2}, r2: ${r2}`)
    const helper = this.checkSerialPort()
    if (l1 < -10) l1 = -10
    if (r1 < -10) r1 = -10
    if (l2 > 10) l2 = 10
    if (r2 > 10) r2 = 10

    if (l1 < 0) l1 = 256 + l1
    if (l2 < 0) l2 = 256 + l2
    if (r1 < 0) r1 = 256 + r1
    if (r2 < 0) r2 = 256 + r2

    await helper.write([chr('X'), chr('R'), 0, l1, r1, l2, r2, 0, chr('S')])
    await this.sendPacketMRTEXE(2)
  }

  // pinNo = [1,5]
  async setServoMotorAngle(pinNum: number, angle: number): Promise<void> {
    if (DEBUG) console.log(`setServoMotorAngle : pinNo: ${pinNum}, angle:${angle}`)
    const helper = this.checkSerialPort()

    if (angle < -90) angle = -90
    if (angle > 90) angle = 90
    if (angle < 0) angle = 255 + angle

    if (pinNum < 1) pinNum = 1
    if (pinNum > 5) pinNum = 5

    await helper.write([chr('X'), chr('R'), 3, pinNum, angle, 0, 0, 0, chr('S')])
    await this.sendPacketMRTEXE(2)
  }

  /**
   * 하드웨어를 연결했을때 자동으로 호출합니다
   */
  async onAfterOpen(): Promise<void> {
    if (DEBUG) console.log('XXX onAfterOpen()')
  }

  /**
   * 연결 종료합니다
   * 클라이언트의 연결이 종료되었을 때,
   * 프레임워크가 자동으로 호출해준다.
   * 이름은 onBeforeClose(), 함수인자는 없어야 한다.
   */
  async onBeforeClose(): Promise<void> {
    if (DEBUG) console.log('XXX onBeforeClose()')
    const helper = this.checkSerialPort()

    // 모터 중지
    try {
      await this.stopDCMotor()
    } catch (err) {}

    // 모든 LED OFF
    try {
      // 아무핀에나 0을 쓰면 모두 0이 된다.
      await this.digitalWrite(1, 0)
    } catch (ignore) {}
  }
}
