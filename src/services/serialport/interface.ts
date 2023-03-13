import { PortInfo } from '@serialport/bindings-interface'
import { SerialPortChannel } from 'src/constants/channels'
import { ProxyPropertyType } from 'src/electron-ipc-cat/common'

/**
 * Manage constant value like `isDevelopment` and many else, so you can know about about running environment in main and renderer process easily.
 */
export interface ISerialPortService {
  list(): Promise<PortInfo[]>
}

export const SerialPortServiceIPCDescriptor = {
  channel: SerialPortChannel.name,
  properties: {
    list: ProxyPropertyType.Function,
  },
}
