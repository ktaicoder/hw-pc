import { SerialPort } from 'serialport'
import { ISerialDeviceOpenParams, ISerialPortInfo, IUiLogger } from 'src/custom-types'
import { SerialDevice } from 'src/hw-server/serialport/SerialDevice'

const DEBUG_TAG = 'codingpack'

/**
 * 지원하는 시리얼포트 여부 체크
 *
 * @param portInfo 포트 정보
 * @returns 지원하는 포트라면 true를 리턴
 */
export function isPortMatch(port: ISerialPortInfo, logger?: IUiLogger): boolean {
  // const { manufacturer, productId, vendorId } = port
  const { manufacturer = '' } = port

  const manufacturerLower = manufacturer.toLowerCase()
  const matched = ['wch.cn'].some((it) => manufacturerLower.includes(it))

  // 로그
  //   if (logger) {
  //     const msg = `isPortMatch() = ${matched ? 'Yes' : 'No'}, ${port.path}, ${manufacturer}`
  //     if (matched) {
  //       logger.i(DEBUG_TAG, msg)
  //     } else {
  //       logger.d(DEBUG_TAG, msg)
  //     }
  //   }

  return matched
}

/**
 * codingpack, serial device open
 * open 중인 상태로, SerialDevice를 리턴한다.
 * 연결이 되기를 기다리려면 await device.waitUntilOpen()
 *
 * @param serialPortPath 시리얼포트 Path, ex) COM1, /dev/ttyUSB0
 * @returns SerialDevice
 */
export function openDevice(params: ISerialDeviceOpenParams): SerialDevice {
  const { serialPortPath } = params
  console.log(DEBUG_TAG, 'openDevice()', serialPortPath)

  // 시리얼 디바이스 생성, 시리얼포트를 감싸는 객체입니다.
  // 실제 serial port의 상태를 관리하고, UI에 로그를 전송합니다.
  const device = new SerialDevice({
    debugTag: DEBUG_TAG,
    port: new SerialPort({
      path: serialPortPath,
      baudRate: 115200,
      autoOpen: false, // autoOpen은 반드시 false
      lock: false, // windows does not support false
    }),
    parser: undefined, // RX 데이터 파서
  })

  // 시리얼 디바이스 열기
  device.open()

  // open 중인 상태의 SerialDevice를 리턴한다
  return device
}
