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

type Props = {
    iconName: string
}

export default function MenuIcon(props: Props) {
    const { iconName } = props
    switch (iconName) {
        case 'adb':
            return <AdbIcon />
        case 'science':
            return <ScienceIcon />
        case 'grade':
            return <GradeIcon />
        case 'github':
            return <GitHubIcon />
        case 'construction':
            return <ConstructionIcon />
        case 'build':
            return <BuildIcon />
        case 'bug_report':
            return <BugReportIcon />
        case 'dashboard':
            return <DashboardIcon />
        case 'settings':
            return <SettingsIcon />
        case 'settings_input_hdmi':
            return <SettingsInputHdmiIcon />
        case 'exit_to_app':
            return <ExitToAppIcon />
        case 'logout':
            return <LogoutIcon />
        case 'usb':
            return <UsbIcon />
        case 'bluetooth':
            return <BluetoothIcon />
        case 'info':
            return <InfoOutlinedIcon />
        case 'mosaic':
            return <AutoAwesomeMosaicIcon />
    }
    return <HardwareIcon />
}
