import { DelimiterParser, SerialPort } from 'serialport'
import { ISerialDeviceOpenParams, ISerialPortInfo } from 'src/custom-types'
import { SerialDevice } from 'src/hw-server/serialport/SerialDevice'

const DEBUG_TAG = 'wiseXboard'

const DELIMITER = Buffer.from([0x52, 0x58, 0x3d, 0x0, 0x0e])

/**
 * 지원하는 시리얼포트 여부 체크
 *
 * @param portInfo 포트 정보
 * @returns 지원하는 포트라면 true를 리턴
 */
export function isPortMatch(port: ISerialPortInfo): boolean {
  // const { manufacturer, productId, vendorId } = port
  const { manufacturer = '' } = port

  // silicon labs(CP210)만 허용
  const matched = ['silicon labs'].includes(manufacturer.toLowerCase())

  return matched
}

/**
 * wiseXboard, 시리얼 디바이스 오픈
 * open 중인 상태의 SerialDevice를 리턴합니다.
 *
 * 연결이 되기를 기다리려면
 * await device.waitUntilOpen()
 *
 * @param serialPortPath 시리얼포트 Path, ex) COM1, /dev/ttyUSB0
 * @param uiLogger UI 콘솔 로거, 사용자 화면에 로깅 메시지를 표시합니다
 * @returns SerialDevice
 */
export function openDevice(params: ISerialDeviceOpenParams): SerialDevice {
  const { serialPortPath, uiLogger } = params
  console.log(DEBUG_TAG, 'openDevice()', serialPortPath)

  // 시리얼 디바이스 생성, 시리얼포트를 감싸는 객체입니다.
  // 실제 serial port의 상태를 관리하고, UI에 로그를 전송합니다.
  const device = new SerialDevice(DEBUG_TAG, uiLogger)

  // 시리얼 포트 생성
  const port = new SerialPort({
    path: serialPortPath,
    baudRate: 38400,
    autoOpen: false, // autoOpen은 반드시 false
  })

  // RX 데이터 파서
  const parser = new DelimiterParser({
    delimiter: DELIMITER,
    includeDelimiter: false,
  })

  // 시리얼 디바이스 열기
  device.open(port, parser)

  // open 중인 상태의 SerialDevice를 리턴합니다.
  return device
}
