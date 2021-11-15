import MuiDrawer from '@mui/material/Drawer'
import { CSSObject, styled, Theme } from '@mui/material/styles'
import { SIDEMENU_BG_COLOR, SIDEMENU_WIDTH } from '../../main-layout-constants'

const openedMixin = (theme: Theme): CSSObject => ({
    width: SIDEMENU_WIDTH,
    background: SIDEMENU_BG_COLOR,
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
})

const closedMixin = (theme: Theme): CSSObject => ({
    width: `calc(${theme.spacing(9)} + 1px)`,
    overflowX: 'hidden',
    background: SIDEMENU_BG_COLOR,
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    [theme.breakpoints.down('xs')]: {
        width: `calc(${theme.spacing(7)} + 1px)`,
    },
})

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(({ theme, open }) => ({
    width: SIDEMENU_WIDTH,
    background: SIDEMENU_BG_COLOR,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
        ...openedMixin(theme),
        '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
        ...closedMixin(theme),
        '& .MuiDrawer-paper': closedMixin(theme),
    }),
}))

export default Drawer
