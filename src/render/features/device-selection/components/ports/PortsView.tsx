import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import Refresh from '@mui/icons-material/Refresh'
import {
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material'
import { Box } from '@mui/system'
import { useEffect, useMemo, useState } from 'react'
import { PortInfo } from 'serialport'

type Props = {
  portInfos: PortInfo[]
  portPath?: string
  onClickPort: (port: PortInfo) => void
  onClickRefresh: () => void
}

export default function PortsView(props: Props) {
  const { portInfos, portPath, onClickPort, onClickRefresh } = props
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const port = useMemo<PortInfo | undefined>(() => portInfos.find((it) => it.path === portPath), [portInfos, portPath])
  const open = Boolean(anchorEl)
  const [refreshing, setRefreshing] = useState(false)

  const handleClickListItem = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleMenuItemClick = (event: React.MouseEvent<HTMLElement>, port: PortInfo) => {
    setAnchorEl(null)
    setTimeout(() => {
      onClickPort(port)
    }, 0)
  }

  useEffect(() => {
    let timer: any = null
    if (refreshing) {
      timer = setTimeout(() => {
        onClickRefresh()
        setRefreshing(false)
      }, 2700)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [refreshing, onClickRefresh])

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        mx: 1,
        pt: 6,
      }}
    >
      {!port && (
        <Box
          sx={{
            mt: 2.5,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            border: '0px solid red',
          }}
        >
          <Typography sx={{ textAlign: 'center', fontSize: '0.9rem', minHeight: 24, color: '#888' }}>
            연결 없음
          </Typography>
          {refreshing && <CircularProgress size="1rem" sx={{ my: 1 }} />}
          {!refreshing && (
            <IconButton onClick={() => setRefreshing(true)}>
              <Refresh fontSize="small" />
            </IconButton>
          )}
        </Box>
      )}
      {port && (
        <>
          <Typography sx={{ display: 'block', textAlign: 'center', fontSize: '0.75rem', mr: 3 }}>연결포트</Typography>
          <List>
            <ListItem sx={{ textAlign: 'center', py: 0 }}>
              <ListItemButton
                onClick={handleClickListItem}
                sx={{
                  margin: '0 auto',
                  '& .MuiListItemIcon-root': {
                    minWidth: 'auto',
                  },
                  '& .MuiListItemText-root': {
                    margin: 0,
                    padding: 0,
                    textAlign: 'center',
                  },
                }}
              >
                <ListItemText primary={port.path} secondary={port.manufacturer} />
                <ListItemIcon>
                  <ArrowDropDownIcon fontSize="small" />
                </ListItemIcon>
              </ListItemButton>
            </ListItem>
          </List>
        </>
      )}
      {portInfos && portInfos.length > 0 && (
        <Menu
          id="lock-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            'aria-labelledby': 'lock-button',
            role: 'listbox',
          }}
        >
          {portInfos.map((it) => (
            <MenuItem
              key={it.path}
              selected={it.path === port?.path}
              onClick={(event) => handleMenuItemClick(event, it)}
            >
              <ListItemText primary={it.path} secondary={it.manufacturer} sx={{ textAlign: 'center' }} />
            </MenuItem>
          ))}
        </Menu>
      )}
    </Box>
  )
}
