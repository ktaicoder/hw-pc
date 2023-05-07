import { nav } from '@cp949/mui-common'
import WysiwygIcon from '@mui/icons-material/Wysiwyg'
import LogoDevIcon from '@mui/icons-material/LogoDev'
import HardwareIcon from '@mui/icons-material/Hardware'
import AutoAwesomeMosaicIcon from '@mui/icons-material/AutoAwesomeMosaic'
import LogoutIcon from '@mui/icons-material/Logout'
import ExitToAppIcon from '@mui/icons-material/ExitToApp'
import AdbIcon from '@mui/icons-material/Adb'
import SettingsIcon from '@mui/icons-material/Settings'
import SettingsInputHdmiIcon from '@mui/icons-material/SettingsInputHdmi'
import UsbIcon from '@mui/icons-material/Usb'
import BluetoothIcon from '@mui/icons-material/Bluetooth'
import DashboardIcon from '@mui/icons-material/Dashboard'
import BuildIcon from '@mui/icons-material/Build'
import BugReportIcon from '@mui/icons-material/BugReport'
import ConstructionIcon from '@mui/icons-material/Construction'
import GitHubIcon from '@mui/icons-material/GitHub'
import GradeIcon from '@mui/icons-material/Grade'
import ScienceIcon from '@mui/icons-material/Science'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import CableIcon from '@mui/icons-material/Cable'

export const sideMenuManager: nav.MenuManager = nav.configureSideMenus([
  {
    type: 'menu',
    icon: <DashboardIcon />,
    title: '장치 연결',
    href: '/',
  },
  {
    type: 'menu',
    icon: <CableIcon />,
    title: '코디니팩 설정',
    href: '/codingpack',
  },
  {
    type: 'menu',
    icon: <UsbIcon />,
    title: 'SERIAL 장치',
    href: '/inspect-serial',
  },
  {
    type: 'menu',
    icon: <InfoOutlinedIcon />,
    title: '정보',
    href: '/info',
  },
])
