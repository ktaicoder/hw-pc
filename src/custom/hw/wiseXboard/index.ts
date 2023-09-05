import { HwKindKey, IHwDescriptor, IHwInfo } from 'src/custom-types/basic-types'
import { isPortMatch, openDevice } from './openDevice'
import { WiseXboardControl } from './WiseXboardControl'

const hwId = 'wiseXboard'
const hwKind: HwKindKey = 'serial'

const info: IHwInfo = {
  hwId,
  hwKind,
  hwName: '와이즈 엑스보드',
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

export const wiseXboard: IHwDescriptor = {
  hwId, // 하드웨어 ID
  hwKind, // 하드웨어 종류
  info, // 하드웨어 정보
  hw: {
    hwId,
    hwKind,
    isPortMatch, // 시리얼포트 지원 함수
    createControl: () => new WiseXboardControl(),
    openDevice,
  },
}
