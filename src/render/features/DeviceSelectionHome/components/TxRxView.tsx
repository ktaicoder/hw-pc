import DesktopAccessDisabledIcon from '@mui/icons-material/DesktopAccessDisabled'
import ImportantDevicesIcon from '@mui/icons-material/ImportantDevices'
import { Stack, SxProps, Tooltip, Typography } from '@mui/material'
import { useEffect } from 'react'
import { useTimeoutData } from 'src/render/hooks/useTimeoutData'
import { useDeviceState } from 'src/services/hw/useDeviceState'
import { useWebSocketClientCount } from 'src/services/hw/useWebSocketClientCount'

type Props = {
  sx?: SxProps
}

export default function TxRxView(props: Props) {
  const { sx } = props
  const webSocketClientCount = useWebSocketClientCount()
  const deviceState = useDeviceState()
  const [txVisible, setTxVisible] = useTimeoutData<boolean>(1000)
  const [rxVisible, setRxVisible] = useTimeoutData<boolean>(1000)
  const { rxTimestamp, txTimestamp } = deviceState

  useEffect(() => {
    const diff = Date.now() - txTimestamp
    if (diff < 1000) {
      setTxVisible(true)
    }
  }, [txTimestamp, setTxVisible])

  useEffect(() => {
    const diff = Date.now() - rxTimestamp
    if (diff < 1000) {
      setRxVisible(true)
    }
  }, [rxTimestamp, setRxVisible])

  return (
    <Stack direction="row" alignItems="center" spacing={2} sx={sx} className="TxRxView-root">
      <Tooltip title="TX: 장치에 송신중">
        <Typography sx={{ fontSize: '0.8rem', color: txVisible ? '#009688' : '#aaa' }}>TX</Typography>
      </Tooltip>

      <Tooltip title="RX: 장치로부터 수신중">
        <Typography sx={{ fontSize: '0.8rem', color: rxVisible ? '#009688' : '#aaa' }}>RX</Typography>
      </Tooltip>

      {webSocketClientCount > 0 ? (
        <Tooltip title="블록코딩 연결됨">
          <ImportantDevicesIcon sx={{ fontSize: '1.1rem', color: '#009688' }} />
        </Tooltip>
      ) : (
        <Tooltip title="블록코딩과 연결안됨">
          <DesktopAccessDisabledIcon sx={{ fontSize: '1.1rem', color: '#aaa' }} />
        </Tooltip>
      )}
    </Stack>
  )
}
