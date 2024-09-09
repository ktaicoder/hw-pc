/**
 * 컨트롤 인터페이스
 */
export interface IRossiMetaControl {
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
  /**
   * 흐름조건 블록 숫자
   * @param ctx - 디바이스
   * @param value - 숫자 값
   */
  blockFlowNumber(ctx: any, value: number): Promise<string>

  /**
   * 변수 1 쓰기
   * @param ctx - 디바이스
   * @param index - 변수 번호
   * @param payload - 인자
   */
  blockFlowWriteVariable(ctx: any, index: number, payload: string): Promise<void>
  blockFlowSetVariable(ctx: any, index: number, value: number, operation: number): Promise<void>
  blockFlowReadVariable(ctx: any, index: number): Promise<string>
  /**
   * 흐름조건 블록 만약
   * @param ctx - 디바이스
   * @param payload 인자로 받은 명려어 맵
   */
  blockFlowIf(ctx: any, payload: string): Promise<void>

  /**
   * 흐름조건 블록 하기 시작
   * @param ctx - 디바이스
   */
  blockFlowIfStart(ctx: any): Promise<void>

  /**
   * 흐름조건 블록 하기 시작
   * @param ctx - 디바이스
   */
  blockFlowElseStart(ctx: any): Promise<void>

  /**
   * 흐름조건 블록 하기 끝
   * @param ctx - 디바이스
   */
  blockFlowIfEnd(ctx: any): Promise<void>

  /**
   * 흐름반복 블록 조건이?이라면 반복하기 시작
   * @param ctx - 디바이스
   * @param payload - 페이로드
   */
  blockFlowLoopCondStart(ctx: any, payload: string): Promise<void>

  /**
   * 흐름반복 블록 조건이?라면 반봅하기 끝
   * @param ctx - 디바이스
   */
  blockFlowLoopCondEnd(ctx: any): Promise<void>

  /**
   * 흐름반복 블록 무한반복 시작
   * @param ctx - 디바이스
   */
  blockFlowLoopStart(ctx: any): Promise<void>

  /**
   * 흐름반복 블록 무한반복 끝
   * @param ctx - 디바이스
   */
  blockFlowLoopEnd(ctx: any): Promise<void>

  /**
   * 흐름반복 블록 N회 반복 시작
   * @param ctx - 디바이스
   * @param count - N회
   */
  blockFlowLoopCntStart(ctx: any, count: number): Promise<void>

  /**
   * 흐름반복 블록 N회 반복 끝
   * @param ctx - 디바이스
   */
  blockFlowLoopCntEnd(ctx: any): Promise<void>

  /**
   * 흐름반복 블록 멈추기 N초
   * @param ctx - 디바이스
   * @param sec - N초 (2bytes)
   */
  blockFlowLoopDelaySec(ctx: any, sec: number, type: number): Promise<void>

  /**
   * 흐름반복 블록 반복 중단
   * @param ctx - 디바이스
   * @param value = 0: break(반복중단), 1: continue(다음반복)
   */
  blockFlowLoopBreakContinue(ctx: any, value: number): Promise<void>

  /**
   * 흐름판단 블록 등호, 부등호
   * @param ctx - 디바이스
   * @param left - 왼쪽 JSON
   * @param right - 오른쪽 JSON
   * @param sign - 등호,부등호 구분자
   */
  blockFlowLoopJgmtSign(ctx: any, left: string, right: string, sign: number): Promise<string>

  /**
   * 흐름판단 블록 참, 거짓
   * @param ctx - 디바이스
   * @param value = 0: false, 1: true
   */
  blockFlowLoopJgmtBool(ctx: any, value: number): Promise<string>

  /**
   * 흐름판단 블록 로직
   * @param ctx - 디바이스
   * @param left
   * @param right
   * @param logic
   */
  blockFlowLoopJgmtLogic(ctx: any, left: string, right: string, logic: number): Promise<string>

  /**
   * IoT Kit 리모컨 값 읽기
   * @param ctx - 디바이스
   */
  blockIotKitReadRemote(ctx: any): Promise<string>

  /**
   * IoT Kit 모든 DC모터 끄기
   * @param ctx - 디바이스
   */
  blockIotKitOffAllDCMotor(ctx: any): Promise<void>

  /**
   * IoT Kit 모든 모터 속도 조절
   * @param ctx - 디바이스
   * @param l1 - 모터1 왼쪽
   * @param r1 - 모터1 오른쪽
   * @param l2 - 모터2 왼쪽
   * @param r2 - 모터2 오른쪽
   */
  blockIotKitAllMotorSpeed(ctx: any, l1: number, l2: number, r1: number, r2: number): Promise<void>
  blockIotKitAllMotorSpeedValue(
    ctx: any,
    l1: string,
    l2: string,
    r1: string,
    r2: string,
  ): Promise<void>
  /**
   * IoT Kit n번 서버모터 각도를 N으로 정하기
   * @param ctx - 디바이스
   * @param pinNum - n번 핀 번호
   * @param speed - 속도
   * @param angle - N각도
   */
  blockIotKitServoMotor(ctx: any, pinNum: number, angle: number, speed: number): Promise<void>
  blockIotKitServoMotorValue(ctx: any, pinNum: number, angle: string, speed: string): Promise<void>

  /**
   * IoT Kit 디지털 n번 핀 N으로 정하기
   * @param ctx - 디바이스
   * @param pinNum - n번 핀 번호
   * @param value - N으로 설정
   */
  blockIotKitDigitalOutput(ctx: any, pinNum: number, value: number): Promise<void>

  /**
   * IoT Kit 아날로그 n번 핀 읽기
   * @param ctx - 디바이스
   * @param pin - n번 핀
   */
  blockIotKitAnalogInput(ctx: any, pin: number): Promise<string>

  /**
   * IoT Kit 디지털 n번 핀 읽기
   * @param ctx - 디바이스
   * @param pin - n번 핀
   */
  blockIotKitDigitalInput(ctx: any, pin: number): Promise<string>

  /**
   * IoT Kit DC모터1 속도 조절
   * @param ctx - 디바이스
   * @param l1 - 모터1 왼쪽 속도
   * @param r1 - 모터1 오른쪽 속도
   */
  blockIotKitDCMotor1(ctx: any, l1: number, r1: number): Promise<void>
  blockIotKitDCMotor1Value(ctx: any, l1: string, r1: string): Promise<void>
  /**
   * IoT Kit DC모터2 속도 조절
   * @param ctx - 디바이스
   * @param l2 - 모터1 왼쪽 속도
   * @param r2 - 모터1 오른쪽 속도
   */
  blockIotKitDCMotor2(ctx: any, l2: number, r2: number): Promise<void>
  blockIotKitDCMotor2Value(ctx: any, l2: string, r2: string): Promise<void>
  /**
   * IoT Kit 블록 Map 저장 시작
   * @param ctx - 디바이스
   * @param num - 저장번호
   */
  blockSaveStart(ctx: any, num: number): Promise<void>

  /**
   * IoT Kit 블록 Map 저장 끝
   * @param ctx - 디바이스
   */
  blockSaveEnd(ctx: any): Promise<void>

  delay(ms: number): Promise<any>
}
