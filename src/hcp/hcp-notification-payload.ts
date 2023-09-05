type AnalogPin = string // ex) A0, A1...
type DigitalPin = number // ex) 0,1,2,...

/**
 * 핀 값 Notification
 */
type AnalogPinValue = {
  kind: 'analogPin'
  pin: AnalogPin
  value: number
}

type DigitalPinValue = {
  kind: 'digitalPin'
  pin: DigitalPin
  value: number
}

/**
 * Led 상태 notification
 */
type LedState = {
  kind: 'led'
  pin: DigitalPin
  value: 'on' | 'off'
}

/**
 * 버튼 상태 notification
 */
type ButtonState = {
  kind: 'button'
  pin: DigitalPin
  value: 'press' | 'hold' | 'release'
}

/**
 * 밝기 센서 notification
 */
type LightState = {
  kind: 'light'
  pin: AnalogPin
  value: number
}

export type HwNotificationPayload =
  | AnalogPinValue
  | DigitalPinValue
  | LedState
  | ButtonState
  | LightState

export type HcpNotificationPayload = HwNotificationPayload

export type HwNotificationKindKey = HwNotificationPayload['kind']
