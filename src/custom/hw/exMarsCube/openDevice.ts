import { SerialPort } from 'serialport'
import { ISerialDeviceOpenParams, ISerialPortInfo } from 'src/custom-types'
import { SerialDevice } from 'src/hw-server/serialport/SerialDevice'

const DEBUG_TAG = 'exMarsCube'

/**
 * 지원하는 시리얼포트 여부 체크
 *
 * @param portInfo 포트 정보
 * @returns 지원하는 포트라면 true를 리턴
 */
export function isPortMatch(port: ISerialPortInfo): boolean {
  // const { manufacturer, productId, vendorId } = port
  const { manufacturer = '' } = port
  return manufacturer.toLowerCase().includes('wch.cn')
}

/**
 * exMarsCube, 시리얼 디바이스 오픈
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
    parser: undefined, // RX 데이터 파서
  })

  // 시리얼 디바이스 열기
  device.open()

  // open 중인 상태의 SerialDevice를 리턴합니다.
  return device
}
