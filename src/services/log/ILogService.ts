import { LogChannel } from 'src/constants/channels'
import { ProxyPropertyType } from 'src/electron-ipc-cat/common'

export interface ILogService {
  selectSerialPort(serialPortPath: string): Promise<void>
  unselectSerialPort(): Promise<void>
}

export const LogServiceIPCDescriptor = {
  channel: LogChannel.name,
  properties: {
    selectSerialPort: ProxyPropertyType.Function,
    unselectSerialPort: ProxyPropertyType.Function,
  },
}
