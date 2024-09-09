/**
 * 컨트롤 인터페이스
 */
export interface IUamVertiPortControl {
  /**
   * DC 모터1,2 속도 설정
   */
  setDCMotorSpeedP(ctx: any, l1: number, r1: number, l2: number, r2: number): Promise<void>

  /**
   * DC 모터1 속도 설정
   */
  setDCMotor1SpeedP(ctx: any, l1: number, r1: number): Promise<void>

  /**
   * DC 모터2 속도 설정
   */
  setDCMotor2SpeedP(ctx: any, l2: number, r2: number): Promise<void>

  /**
   * 모든 DC 모터 끄기
   */
  stopDCMotorP(ctx: any): Promise<void>

  /**
   * n번핀 서보모터 각도 angle로 정하기
   */
  setServoMotorAngleP(ctx: any, pinNum: number, angle: number, speed: number): Promise<void>

  /**
   * 리모콘 값 읽기
   */
  readRemoconP(ctx: any): Promise<number>

  /**
   * 아날로그 핀 읽기
   * pin=[1,7]
   */
  analogReadP(ctx: any, pin: number): Promise<number>

  /**
   * 디지털 핀 읽기
   * pin=[1,7]
   */
  digitalReadP(ctx: any, pin: number): Promise<number>

  /**
   * 디지털 n번핀 value로 정하기
   */
  digitalWriteP(ctx: any, pin: number, value: number): Promise<void>

  /**
   * 키값 전송
   */
  sendKeyP(ctx: any, key: number): Promise<void>
  inspectionKit(ctx: any): Promise<void>
  delay(ms: number): Promise<any>
}
