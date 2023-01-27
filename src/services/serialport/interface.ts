import { ProxyPropertyType } from 'src/electron-ipc-cat/common'
import SerialPort from 'serialport'
import { SerialPortChannel } from 'src/constants/channels'

/**
 * Manage constant value like `isDevelopment` and many else, so you can know about about running environment in main and renderer process easily.
 */
export interface ISerialPortService {
  list(): Promise<SerialPort.PortInfo[]>
}

export const SerialPortServiceIPCDescriptor = {
  channel: SerialPortChannel.name,
  properties: {
    list: ProxyPropertyType.Function,
  },
}
