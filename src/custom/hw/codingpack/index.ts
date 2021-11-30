import { HwKind, IHwInfo } from 'src/custom-types/hw-types'
import { CodingpackControl } from './CodingpackControl'

const HWID = 'codingpack'

const info: IHwInfo = {
    hwId: HWID,
    hwKind: HwKind.terminal,
    hwName: '코딩팩',
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
    operator: CodingpackControl,
    control: () => new CodingpackControl(),
}
