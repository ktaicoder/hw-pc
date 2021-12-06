import { HwKind, IHwInfo } from 'src/custom-types/hw-types'
import { WiseXboardPremiumControl } from './WiseXboardPremiumControl'

const HWID = 'wiseXboardPremium'

const info: IHwInfo = {
    hwId: HWID,
    hwKind: HwKind.serial,
    hwName: '와이즈 AI키트',
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

export default {
    hwId: HWID,
    info,
    operator: WiseXboardPremiumControl,
    control: () => new WiseXboardPremiumControl(),
}
