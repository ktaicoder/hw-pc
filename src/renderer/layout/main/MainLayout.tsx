import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'
import { observer } from 'mobx-react'
import * as React from 'react'
import useStore from 'src/renderer/store/useStore'
import DrawerHeader from './components/drawer-header/DrawerHeader'
import Drawer from './components/drawer/Drawer'
import MainPageTopbar from './components/main-page-topbar'
import Sidebar from './components/sidebar'
import Topbar from './components/topbar'
import { CONTENT_BG_COLOR } from './main-layout-constants'
import MainLayoutContext from './MainLayoutContext'

const Main = styled('main', {
    shouldForwardProp: (prop) => prop !== 'open',
})<{
    open?: boolean
}>(({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(0, 0, 0, 0),
    transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    // marginLeft: `-${SIDEMENU_WIDTH}px`,
    ...(open && {
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
        marginLeft: 0,
    }),
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: CONTENT_BG_COLOR,
}))

type Props = {
    title: string
    isMainPage?: boolean
    children?: React.ReactChild | React.ReactChild[]
}

function MainLayout(props: Props) {
    const { title, children, isMainPage = false } = props
    const { sidebarStore } = useStore()
    const isSidebarOpen = sidebarStore.isOpen
    const [hwKind, setHwKind] = React.useState<'all' | 'serial' | 'bluetooth'>('all')
    const [searchQuery, setSearchQuery] = React.useState<string>()

    const contextData = React.useMemo(
        () => ({
            hwKind,
            setHwKind,
            searchQuery,
            setSearchQuery,
        }),
        [hwKind, searchQuery],
    )

    return (
        <MainLayoutContext.Provider value={contextData}>
            <Box sx={{ display: 'flex', position: 'relative' }}>
                {isMainPage ? (
                    <MainPageTopbar
                        title={title}
                        isSidebarOpen={isSidebarOpen}
                        onClickMenuButton={() => sidebarStore.toggleOpen()}
                    />
                ) : (
                    <Topbar
                        title={title}
                        isSidebarOpen={isSidebarOpen}
                        onClickMenuButton={() => sidebarStore.toggleOpen()}
                    />
                )}
                <Drawer variant="permanent" open={isSidebarOpen}>
                    <Sidebar />
                </Drawer>
                <Main open={isSidebarOpen}>
                    <DrawerHeader />
                    <Box
                        sx={{
                            flexGrow: 1,
                        }}
                    >
                        {children}
                    </Box>
                </Main>

                {/* top divider */}
                <Box
                    sx={{
                        position: 'absolute',
                        content: '""',
                        top: 0,
                        left: 0,
                        right: 0,
                        width: '100%',
                        height: '1px',
                        zIndex: 9999,
                        background: 'rgba(0,0,0,0.05)',
                    }}
                />
            </Box>
        </MainLayoutContext.Provider>
    )
}

export default observer(MainLayout)
