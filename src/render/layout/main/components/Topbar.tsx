import { MdOrUp } from '@cp949/mui-common'
import { Menu as MenuIcon, MenuOpen as MenuOpenIcon } from '@mui/icons-material'
import { Box, IconButton, Toolbar, Typography } from '@mui/material'
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar'
import { styled } from '@mui/material/styles'
import { observer } from 'mobx-react'
import { Choose } from 'react-extras'
import { useStore } from 'src/render/lib/store/useStore'
import { SIDEMENU_WIDTH } from '../main-layout-constants'

type Props = {
  title?: React.ReactNode
  className?: string
}

function Topbar(props: Props) {
  const { title = '' } = props
  const { sidebarStore } = useStore()
  const isSidebarOpen = sidebarStore.isOpen

  const handleClickMenuBtn = () => {
    sidebarStore.toggleOpen()
  }

  return (
    <AppBar position="fixed" open={isSidebarOpen} className="Topbar-root">
      <Toolbar variant="dense">
        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <IconButton
            onClick={handleClickMenuBtn}
            color="inherit"
            aria-label="open drawer"
            edge="start"
            sx={{ mr: '16px' }}
          >
            {isSidebarOpen ? <MenuOpenIcon /> : <MenuIcon />}
          </IconButton>
          <Choose>
            <Choose.When condition={typeof title === 'string'}>
              <MdOrUp>
                <Typography
                  variant="subtitle1"
                  noWrap
                  component="div"
                  sx={{
                    color: 'primary.dark',
                    fontSize: '1.0rem',
                    fontWeight: 700,
                  }}
                >
                  {title}
                </Typography>
              </MdOrUp>
            </Choose.When>
            <Choose.Otherwise>{title}</Choose.Otherwise>
          </Choose>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

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
  color: theme.palette.primary.main,
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
      paddingLeft: theme.spacing(3.5),
      [theme.breakpoints.down('xs')]: {
        paddingLeft: theme.spacing(3),
      },
    },
  }),
}))

export default observer(Topbar)
