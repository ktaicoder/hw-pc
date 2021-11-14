/**
 * 시리얼포트 정보
 * serialport 모듈의 SerialPort.PortInfo와 동일하다
 * 라이브러리 의존성을 없애기 위해 같은 형태로 만들었다
 */
export interface ISerialPortInfo {
    path: string
    manufacturer?: string
    serialNumber?: string
    pnpId?: string
    locationId?: string
    productId?: string
    vendorId?: string
}
