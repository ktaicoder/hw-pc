export interface IWiseXboardControl {
  analogRead(ctx: any, pin: number): Promise<number>
  digitalRead(ctx: any, pin: number): Promise<number>
  digitalWrite(ctx: any, pin: number, value: number): Promise<void>
  setHumanoidMotion(ctx: any, index: number): Promise<void>
  stopDCMotor(ctx: any): Promise<void>
  setDCMotorSpeed(ctx: any, l1: number, r1: number, l2: number, r2: number): Promise<void>
  setServoMotorAngle(ctx: any, pinNum: number, angle: number): Promise<void>
}
