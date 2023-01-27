import { ProxyPropertyType } from 'src/electron-ipc-cat/common'
import { Device } from 'node-hid'
import { HidChannel } from 'src/constants/channels'

/**
 * Manage constant value like `isDevelopment` and many else, so you can know about about running environment in main and renderer process easily.
 */
export interface IHidService {
  devices(): Promise<Device[]>
}

export const HidServiceIPCDescriptor = {
  channel: HidChannel.name,
  properties: {
    devices: ProxyPropertyType.Function,
  },
}
