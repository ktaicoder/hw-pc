import { HardwareDescriptor, IHwControl } from 'src/custom-types/hw-types'

/**
 * 컨트롤 인터페이스 - 클라이언트(ex: 블록코딩)에서 사용
 * 클라이언트는 이 인터페이스를 Proxy 하여 RPC 처럼 호출
 */
export interface IWiseXboardControl extends IHwControl {
    analogRead(): Promise<number[]>
    digitalRead(): Promise<number[]>
    digitalWrite(pin: number, value: number): Promise<void>
    setHumanoidMotion(index: number): Promise<void>
    stopDCMotor(): Promise<void>
    setDCMotorSpeed(l1: number, r1: number, l2: number, r2: number): Promise<void>
    setServoMotorAngle(pinNum: number, angle: number): Promise<void>
}

/**
 * 하드웨어 디스크립터: commands
 * 변수이름을 hwId로 해야 함
 */
export const wiseXboard: HardwareDescriptor = {
    commands: [
        'analogRead', //
        'digitalRead',
        'digitalWrite',
        'setHumanoidMotion',
        'stopDCMotor',
        'setDCMotorSpeed',
        'setServoMotorAngle',
    ],
}
