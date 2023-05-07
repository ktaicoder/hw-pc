import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import Refresh from '@mui/icons-material/Refresh'
import {
  Box,
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
import { default as sleepAsync } from 'delay'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ISerialPortInfo } from 'src/custom-types'

type Props = {
  portInfos: ISerialPortInfo[]
  portPath?: string
  onSelectPort: (port: ISerialPortInfo | undefined) => void
  onClickRefresh: () => void
  showEmptyMenu?: boolean
}

export default function PortsView(props: Props) {
  const { showEmptyMenu = false, portInfos = [], portPath, onSelectPort } = props
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const port = useMemo<ISerialPortInfo | undefined>(
    () => portInfos.find((it) => it.path === portPath),
    [portInfos, portPath],
  )
  const open = !!anchorEl
  const [refreshToken, setRefreshToken] = useState(0)
  const onClickRefreshRef = useRef<Props['onClickRefresh']>()
  onClickRefreshRef.current = props.onClickRefresh

  const handleClickListItem = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleMenuItemClick = (port: ISerialPortInfo | undefined) => (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(null)
    setTimeout(() => {
      onSelectPort(port)
    }, 0)
  }

  const doDummyLoad = useCallback(async (ctx: { canceled: boolean }, milli: number) => {
    try {
      let remain = milli
      while (remain > 0 && !ctx.canceled) {
        await sleepAsync(50)
        remain -= 50
      }
      if (ctx.canceled) return
      onClickRefreshRef.current?.()
      setRefreshToken(0)
    } catch (ignore) {}
  }, [])

  // dummy loading
  useEffect(() => {
    if (refreshToken === 0) return
    const ctx = { canceled: false }
    doDummyLoad(ctx, 2700)
    return () => {
      ctx.canceled = true
    }
  }, [refreshToken, doDummyLoad])

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        mx: 1,
        pt: 6,
      }}
    >
      {(port || showEmptyMenu) && (
        <>
          <Typography sx={{ display: 'block', textAlign: 'center', fontSize: '0.75rem', mr: 3 }}>연결포트</Typography>
          <List>
            <ListItem sx={{ textAlign: 'center', py: 0 }}>
              <ListItemButton
                onClick={handleClickListItem}
                sx={{
                  mx: 'auto',
                  '& .MuiListItemIcon-root': {
                    minWidth: 'auto',
                  },
                  '& .MuiListItemText-root': {
                    m: 0,
                    p: 0,
                    textAlign: 'center',
                  },
                }}
              >
                {port ? (
                  <ListItemText primary={port.path} secondary={port.manufacturer} />
                ) : (
                  <ListItemText primary="선택" secondary="" />
                )}
                <ListItemIcon>
                  <ArrowDropDownIcon fontSize="small" />
                </ListItemIcon>
              </ListItemButton>
            </ListItem>
          </List>
        </>
      )}

      {!port && portInfos.length === 0 && (
        <Box
          sx={{
            mt: 2.5,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Typography
            sx={{
              textAlign: 'center',
              fontSize: '0.9rem',
              minHeight: 24,
              color: '#888',
            }}
          >
            연결 없음
          </Typography>
          {refreshToken > 0 && <CircularProgress size="1rem" sx={{ my: 1 }} />}
          {refreshToken === 0 && (
            <IconButton onClick={() => setRefreshToken(Date.now())}>
              <Refresh fontSize="small" />
            </IconButton>
          )}
        </Box>
      )}

      {portInfos.length > 0 && (
        <Menu
          id="ports-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            'aria-labelledby': 'port-button',
            role: 'listbox',
          }}
        >
          <MenuItem selected={!port} onClick={handleMenuItemClick(undefined)}>
            <ListItemText primary="선택" secondary="" sx={{ textAlign: 'center' }} />
          </MenuItem>

          {portInfos.map((it) => (
            <MenuItem key={it.path} selected={it.path === port?.path} onClick={handleMenuItemClick(it)}>
              <ListItemText primary={it.path} secondary={it.manufacturer} sx={{ textAlign: 'center' }} />
            </MenuItem>
          ))}
        </Menu>
      )}
    </Box>
  )
}
