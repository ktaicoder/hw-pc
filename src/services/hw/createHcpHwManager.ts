import { HardwareDescriptors } from 'src/custom'
import { HcpHwManager } from 'src/hcp/HcpHwManager'
import { IHcpHwManager } from 'src/hcp/hcp-types'

type HwId =  keyof typeof HardwareDescriptors

export function createHcpHwManager(hwId: HwId): IHcpHwManager {
    return new HcpHwManager({
      hw: HardwareDescriptors[hwId].hw
    })
}
