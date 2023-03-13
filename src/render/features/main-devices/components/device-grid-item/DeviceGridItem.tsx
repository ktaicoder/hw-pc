import BluetoothIcon from '@mui/icons-material/Bluetooth'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import UsbIcon from '@mui/icons-material/Usb'
import { Box, ButtonBase, Divider, IconButton, Paper, Typography } from '@mui/material'
import { IHwInfo } from 'src/custom-types/basic-types'
import Image from 'src/render/components/Image'

type Props = {
  info: IHwInfo
  star: boolean
  onClick: (device: IHwInfo) => void
  onClickFavor: (hwId: string) => void
}

const getHwName = (info: IHwInfo): string => {
  if (typeof info.hwName === 'string') {
    return info.hwName
  }
  return Object.values(info.hwName)[0]
}

export default function DeviceGridItem(props: Props) {
  const { onClick, onClickFavor, star, info } = props

  const isUsb = info.hwKind === 'serial'
  const isBluetooth = !isUsb
  const hwName = getHwName(info)

  return (
    <Paper sx={{ overflow: 'hidden' }}>
      <ButtonBase
        component="div"
        onClick={() => onClick(info)}
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          overflow: 'visible',
          pt: 2,
          pb: 3,
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: 100,
            mt: 2,
            px: 1,
            overflow: 'visible',
            border: '0px solid blue',
            '& img': {
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              transition: '500ms',
            },
            '& img:hover': {
              transform: 'scale(1.3)',
            },
          }}
        >
          <Image src={`static/images/devices/${info.hwId}.png`} />
        </Box>

        <Box sx={{ position: 'absolute', zIndex: 1, top: 0, right: 0 }}>
          <IconButton
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onClickFavor(info.hwId)
            }}
          >
            {star ? (
              <StarIcon
                fontSize="small"
                sx={{
                  color: '#fbc02d',
                  opacity: 1,
                }}
              />
            ) : (
              <StarBorderIcon
                fontSize="small"
                sx={{
                  color: 'text.disabled',
                  opacity: 0.3,
                }}
              />
            )}
          </IconButton>
        </Box>
      </ButtonBase>

      <Divider />
      <Box
        sx={{
          width: '100%',
          textAlign: 'center',
          height: 38,
          px: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isUsb && (
          <UsbIcon
            sx={{
              fontSize: '1.1rem',
              color: isUsb ? '#1EAEFF' : 'text.disabled',
              opacity: isUsb ? 1 : 0.3,
            }}
          />
        )}
        {isBluetooth && (
          <BluetoothIcon
            sx={{
              fontSize: '1.1rem',
              color: isBluetooth ? 'info.main' : 'text.disabled',
              opacity: isBluetooth ? 1 : 0.3,
            }}
          />
        )}

        <Typography
          variant="body2"
          sx={{
            pl: 1,
            borderTop: '0px solid #ddd',
            whiteSpace: 'nowrap',
            fontSize: hwName.length > 18 ? '0.70rem' : hwName.length > 15 ? '0.75rem' : '0.8rem',
          }}
        >
          {hwName}
        </Typography>
      </Box>

      {/* <HardwareIcon />
                <LogoutIcon />
                <ExitToAppIcon />
                <AdbIcon />
                <SettingsIcon />
                <SettingsInputHdmiIcon />
                <DashboardIcon />
                <BuildIcon />
                <BugReportIcon />
                <ConstructionIcon />
                <GitHubIcon />
                <GradeIcon />
                <ScienceIcon /> */}
    </Paper>
  )
}
