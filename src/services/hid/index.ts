import { injectable } from 'inversify'
import HID, { Device } from 'node-hid'
import { IHidService } from './interface'

@injectable()
export class HidService implements IHidService {
  constructor() {}

  public async devices(): Promise<Device[]> {
    const devs = HID.devices()
    return devs
  }
}
