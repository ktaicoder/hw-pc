import { HwKind, IHwInfo } from 'src/custom-types/hw-types'
import { WiseXboardPremiumControl } from './WiseXboardPremiumControl'

const HWID = 'wiseXboardPremium'

const info: IHwInfo = {
  hwId: HWID,
  hwKind: HwKind.serial,
  hwName: 'KT AI Codiny IoT 키트',
  category: 'module',
  supportPlatforms: ['win32'],
  pcDrivers: [
    {
      name: 'USB 드라이버',
      'win32-ia32': 'CP210x_Universal_Windows_Driver/CP210xVCPInstaller_x86.exe',
      'win32-x64': 'CP210x_Universal_Windows_Driver/CP210xVCPInstaller_x64.exe',
    },
  ],
}

export default {
  hwId: HWID,
  info,
  operator: WiseXboardPremiumControl,
  control: () => new WiseXboardPremiumControl(),
}
