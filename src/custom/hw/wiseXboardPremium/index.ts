import { HwKindKey, IHwDescriptor, IHwInfo } from 'src/custom-types/basic-types'
import { isPortMatch, openDevice } from './openDevice'
import { WiseXboardPremiumControl } from './WiseXboardPremiumControl'

const hwId = 'wiseXboardPremium'
const hwKind: HwKindKey = 'serial'

const info: IHwInfo = {
  hwId,
  hwKind,
  hwName: 'KT AI Codiny IoT 키트',
  category: 'module',
  supportPlatforms: ['win32'],
  pcDrivers: [
    {
      name: 'USB 드라이버',
      'win32-ia32': 'CP210x_Windows_Drivers/CP210xVCPInstaller_x86.exe',
      'win32-x64': 'CP210x_Windows_Drivers/CP210xVCPInstaller_x64.exe',
    },
  ],
  autoSelect: true,
}

export const wiseXboardPremium: IHwDescriptor = {
  hwId, // 하드웨어 ID
  hwKind, // 하드웨어 종류
  info, // 하드웨어 정보
  hw: {
    hwId,
    hwKind,
    isPortMatch, // 시리얼포트 매치 함수
    createControl: () => new WiseXboardPremiumControl(),
    openDevice,
  },
}
