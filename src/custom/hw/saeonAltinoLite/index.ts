import { HwKind, IHwInfo } from 'src/custom-types/hw-types'
import { SaeonAltinoLiteControl } from './SaeonAltinoLiteControl'

const HWID = 'saeonAltinoLite'

const info: IHwInfo = {
  hwId: HWID,
  hwKind: HwKind.serial,
  hwName: '새온 알티노라이트',
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
  operator: SaeonAltinoLiteControl,
  control: () => new SaeonAltinoLiteControl(),
}
