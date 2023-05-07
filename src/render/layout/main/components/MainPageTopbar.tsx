import { MdOrUp } from '@cp949/mui-common'
import { Menu as MenuIcon, MenuOpen as MenuOpenIcon } from '@mui/icons-material'
import BluetoothIcon from '@mui/icons-material/Bluetooth'
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked'
import SearchIcon from '@mui/icons-material/Search'
import UsbIcon from '@mui/icons-material/Usb'
import { IconButton, InputBase, ToggleButton, ToggleButtonGroup, Toolbar, Typography } from '@mui/material'
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar'
import { alpha, styled } from '@mui/material/styles'
import { Box } from '@mui/system'
import { observer } from 'mobx-react'
import React, { useContext } from 'react'
import { useMeasure } from 'react-use'
import { useStore } from 'src/render/lib/store/useStore'
import MainLayoutContext from '../MainLayoutContext'
import { SIDEMENU_WIDTH } from '../main-layout-constants'

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  '& .MuiToggleButtonGroup-grouped': {
    fontSize: '0.9rem',
    '&.MuiToggleButton-root': {
      paddingTop: 1,
      paddingBottom: 1,
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
      whiteSpace: 'nowrap',
      [theme.breakpoints.down('sm')]: {
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(1),
      },
      '& .MuiSvgIcon-root': {
        marginRight: 4,
        fontSize: '1rem',
      },
    },
    '&.MuiToggleButton-root.Mui-selected': {
      color: theme.palette.primary.main,
      borderColor: alpha(theme.palette.primary.main, 0.3),
    },
    '&:not(:first-of-type)': {
      borderRadius: 0, //theme.shape.borderRadius,
    },
    '&:first-of-type': {
      borderRadius: 0, //theme.shape.borderRadius,
    },
  },
}))

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  border: '1px solid #ccc',
  color: '#aaa',
  // backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(1),
    width: 'auto',
  },
}))

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ccc',
  '& .MuiSvgIcon-root': {
    fontSize: '1.1rem',
  },
}))

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: '#444',
  '& .MuiInputBase-input': {
    padding: theme.spacing(0.5, 1, 0.5, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: '8ch',
      '&:focus': {
        width: '16ch',
      },
    },
  },
}))

interface AppBarProps extends MuiAppBarProps {
  open?: boolean
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  backgroundColor: '#fff',
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  color: '#005CA2',
  ...(open && {
    width: `calc(100% - ${SIDEMENU_WIDTH}px)`,
    marginLeft: SIDEMENU_WIDTH,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
  ...(!open && {
    '& .MuiToolbar-root': {
      width: '100%',
      paddingLeft: theme.spacing(3.5),
      [theme.breakpoints.down('xs')]: {
        paddingLeft: theme.spacing(3),
      },
    },
  }),
}))

type Props = {
  title: string
  className?: string
}

function MainPageTopbar(props: Props) {
  const { title = 'No title' } = props
  const { sidebarStore } = useStore()

  const isSidebarOpen = sidebarStore.isOpen

  const [toolbarRef, { width: toolbarWidth }] = useMeasure<HTMLDivElement>()
  const { hwKind, setHwKind, searchQuery, setSearchQuery } = useContext(MainLayoutContext)!

  const handleChangeHwKind = (event: React.MouseEvent<HTMLElement>, newValue: string) => {
    if (newValue === 'all' || newValue === 'serial' || newValue === 'bluetooth') {
      setHwKind(newValue)
    }
  }

  const handleChangeSearchQuery = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log({ event, value: event.target.value })
    setSearchQuery(event.target.value)
  }

  const handleClickMenuBtn = () => {
    sidebarStore.toggleOpen()
  }

  const isNarrow = !toolbarWidth || toolbarWidth < 660
  // const isVeryNarrow = !toolbarWidth || toolbarWidth < 500

  return (
    <AppBar position="fixed" open={isSidebarOpen}>
      <Toolbar variant="dense" ref={toolbarRef}>
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center' }}>
            <IconButton
              onClick={handleClickMenuBtn}
              color="inherit"
              aria-label="open drawer"
              edge="start"
              sx={{
                // ...(isSidebarOpen && { display: 'none' }),
                marginRight: '16px',
              }}
            >
              {isSidebarOpen ? <MenuOpenIcon htmlColor="#005CA2" /> : <MenuIcon htmlColor="#005CA2" />}
            </IconButton>
            <MdOrUp>
              <Typography variant="subtitle1" noWrap component="div" sx={{ fontSize: '1.0rem', fontWeight: 600 }}>
                {title}
              </Typography>
            </MdOrUp>
          </Box>

          <Box
            sx={{
              display: 'inline-flex',
              position: 'absolute',
              left: '50%',
              top: '50%',
              background: (theme) => theme.palette.background.paper,
              transform: 'translate(-50%, -50%)',
              border: (theme) => `0px solid ${theme.palette.divider}`,
              flexWrap: 'nowrap',
            }}
          >
            <StyledToggleButtonGroup
              size="small"
              value={hwKind}
              exclusive
              onChange={handleChangeHwKind}
              aria-label="text alignment"
              color="primary"
            >
              <ToggleButton value="all" aria-label="all">
                <RadioButtonCheckedIcon />
                전체
              </ToggleButton>
              <ToggleButton value="serial" aria-label="serial">
                <UsbIcon />
                시리얼
              </ToggleButton>
              <ToggleButton value="bluetooth" aria-label="bluetooth">
                <BluetoothIcon />
                블루투스
              </ToggleButton>
            </StyledToggleButtonGroup>
          </Box>

          {!isNarrow && (
            <Search>
              <SearchIconWrapper>
                <SearchIcon />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder="Search"
                size="small"
                value={searchQuery ?? ''}
                onChange={handleChangeSearchQuery}
                inputProps={{ 'aria-label': 'search' }}
              />
            </Search>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default observer(MainPageTopbar)
