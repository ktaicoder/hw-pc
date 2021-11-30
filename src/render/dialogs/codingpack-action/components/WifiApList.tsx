import SignalWifi1BarIcon from '@mui/icons-material/SignalWifi1Bar'
import SignalWifi2BarIcon from '@mui/icons-material/SignalWifi2Bar'
import SignalWifi3BarIcon from '@mui/icons-material/SignalWifi3Bar'
import SignalWifi4BarIcon from '@mui/icons-material/SignalWifi4Bar'
import { List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import { SxProps } from '@mui/system'
import { WifiAp } from '../socket/HwClient'

type Props = {
    wifiApList: WifiAp[]
    onClick: (ap: WifiAp) => void
}

const SignalIcon = (props: { signal: number } & SxProps) => {
    const { signal } = props
    if (signal > 90) {
        return <SignalWifi4BarIcon />
    }
    if (signal > 70) {
        return <SignalWifi3BarIcon />
    }
    if (signal > 50) {
        return <SignalWifi2BarIcon />
    }
    return <SignalWifi1BarIcon />
}

export default function WifiApList(props: Props) {
    const { wifiApList, onClick } = props

    return (
        <List
            sx={{ width: '100%', bgcolor: 'background.paper' }}
            component="nav"
            aria-labelledby="nested-list-subheader"
        >
            {wifiApList.map((ap, idx) => (
                <ListItemButton onClick={() => onClick(ap)} key={ap.ssid + idx}>
                    <ListItemIcon>
                        <SignalIcon signal={ap.signal} />
                    </ListItemIcon>
                    <ListItemText primary={ap.ssid} />
                </ListItemButton>
            ))}
        </List>
    )
}
