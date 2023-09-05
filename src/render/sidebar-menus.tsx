import DashboardIcon from '@mui/icons-material/Dashboard'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import UsbIcon from '@mui/icons-material/Usb'
import { nav } from './lib/nav'

export const sideMenuManager: nav.MenuManager = nav.configureSideMenus([
  {
    type: 'menu',
    icon: <DashboardIcon />,
    title: '장치 연결',
    href: '/',
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
