import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Box, IconButton, Toolbar, Tooltip, Typography } from '@mui/material'
import Image from 'src/render/components/Image'

type Props = {
  hwId: string
  hwName: string
}

export default function ToolbarView(props: Props) {
  const { hwId, hwName } = props

  const handleClickBack = () => {
    window.service.hw.unselectHw()
  }

  const handleClickChrome = () => {
    // window.service.hw.downloadDriver(driverPath)
    window.service.native.openUrl('https://aicodiny.com/codex')
  }

  return (
    <Toolbar
      variant="dense"
      sx={{
        background: 'linear-gradient(90deg, rgba(0,92,162,1) 0%, rgba(0,51,115,1) 50%, rgba(80,137,212,1) 100%)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flex: 0,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton
          onClick={handleClickBack}
          color="inherit"
          aria-label="open drawer"
          edge="start"
          sx={{
            marginRight: '24px',
          }}
        >
          <ArrowBackIcon htmlColor="#fff" />
        </IconButton>
        <Typography variant="subtitle1" sx={{ color: '#FFF' }}>
          {hwName}
        </Typography>
      </Box>
      <Tooltip title="브라우저 열기">
        <IconButton
          onClick={handleClickChrome}
          color="inherit"
          aria-label="open drawer"
          edge="start"
          sx={{
            marginRight: '24px',
          }}
        >
          <Image sx={{ width: 24, height: 24 }} src="static/images/ic_chrome.png" />
        </IconButton>
      </Tooltip>
    </Toolbar>
  )
}
