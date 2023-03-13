import { HwKindKey, IHwDescriptor, IHwInfo } from 'src/custom-types/basic-types'
import { CodingpackControl } from './CodingpackControl'
import { isPortMatch, openDevice } from './openDevice'

const hwId = 'codingpack'
const hwKind: HwKindKey = 'terminal'

const info: IHwInfo = {
  hwId,
  hwKind,
  hwName: '코디니팩',
  category: 'module',
  supportPlatforms: ['win32'],
  pcDrivers: [
    {
      name: 'USB 드라이버',
      'win32-ia32': 'CH34x/CH34x_Install_Windows_v3_4.exe',
      'win32-x64': 'CH34x/CH34x_Install_Windows_v3_4.exe',
    },
  ],
}

export const codingpack: IHwDescriptor = {
  hwId, // 하드웨어 ID
  hwKind, // 하드웨어 종류
  info, // 하드웨어 정보
  hw: {
    hwId,
    hwKind,
    isPortMatch, // 시리얼포트 매치 함수
    createControl: () => new CodingpackControl(),
    openDevice,
  },
}
