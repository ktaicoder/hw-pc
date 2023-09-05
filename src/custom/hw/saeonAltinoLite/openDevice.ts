import { SerialPort } from 'serialport'
import { ISerialDeviceOpenParams, ISerialPortInfo } from 'src/custom-types'
import { SerialDevice } from 'src/hw-server/serialport/SerialDevice'
import { SaeonAltinoLiteParser } from './SaeonAltinoLiteParser'

const DEBUG_TAG = 'saeonAltinoLite'

/**
 * 지원하는 시리얼포트 여부 체크
 *
 * @param portInfo 포트 정보
 * @returns 지원하는 포트라면 true를 리턴
 */
export function isPortMatch(portInfo: ISerialPortInfo): boolean {
  // const { path, manufacturer, productId, vendorId } = port
  const { manufacturer = '' } = portInfo

  if (manufacturer.length === 0) {
    return true
  }

  // altino는 블루투스 SPP(serial port profile)라서,
  // 매칭 규칙을 설정할 수 없으니, 기본적으로 모두 허용합니다.
  // 하지만, 유명한 몇 개만 걸러내도 사용자에게 유용할 것 같습니다.
  // silicon labs(CP210)와 wch.cn(CH340)을 걸러냅니다.
  const blackList = new Set(['silicon labs', 'wch.cn'])
  const matched = !blackList.has(manufacturer.toLowerCase())

  return matched
}

/**
 * saeonAltinoLite, 시리얼 디바이스 오픈
 * open 중인 상태의 SerialDevice를 리턴합니다.
 *
 * 연결이 되기를 기다리려면
 * await device.waitUntilOpen()
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
    parser: new SaeonAltinoLiteParser(), // RX 데이터 파서
  })

  // 시리얼 디바이스 열기
  device.open()

  // open 중인 상태의 SerialDevice를 리턴합니다.
  return device
}
