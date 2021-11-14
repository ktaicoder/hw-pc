import { Menu as MenuIcon, MenuOpen as MenuOpenIcon } from '@mui/icons-material'
import BluetoothIcon from '@mui/icons-material/Bluetooth'
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked'
import SearchIcon from '@mui/icons-material/Search'
import UsbIcon from '@mui/icons-material/Usb'
import { IconButton, InputBase, Paper, ToggleButton, ToggleButtonGroup, Toolbar, Typography } from '@mui/material'
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar'
import { alpha, styled } from '@mui/material/styles'
import { Box } from '@mui/system'
import React, { useContext, useState } from 'react'
import { useMeasure } from 'react-use'
import { SIDEMENU_WIDTH } from '../../main-layout-constants'
import MainLayoutContext from '../../MainLayoutContext'

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
    '& .MuiToggleButtonGroup-grouped': {
        margin: theme.spacing(0, 0),

        border: 0,
        '&.Mui-disabled': {
            border: 0,
        },
        '&.MuiToggleButton-root': {
            paddingLeft: theme.spacing(3),
            paddingRight: theme.spacing(3),
            whiteSpace: 'nowrap',
            [theme.breakpoints.down('sm')]: {
                paddingLeft: theme.spacing(1),
                paddingRight: theme.spacing(1),
            },
        },
        color: '#fff',
        opacity: 0.5,

        '&.MuiToggleButton-root.Mui-selected': {
            // color: theme.palette.primary.main,
            color: '#FFF',
            opacity: 1,
        },
        '&:not(:first-of-type)': {
            borderRadius: theme.shape.borderRadius,
        },
        '&:first-of-type': {
            borderRadius: theme.shape.borderRadius,
        },
    },
}))

const Search = styled('div')(({ theme }) => ({
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
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
    '& .MuiSvgIcon-root': {
        fontSize: '1.1rem',
    },
}))

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: 'inherit',
    '& .MuiInputBase-input': {
        padding: theme.spacing(1, 1, 1, 0),
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
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    color: '#FFF',
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

/**
 * 대시보드 상단 Topbar
 */
type Props = {
    title: string
    className?: string
    isSidebarOpen: boolean
    onClickMenuButton?: any
}

export default function MainPageTopbar(props: Props) {
    const { title = 'No title', isSidebarOpen, onClickMenuButton } = props
    const [toolbarRef, { width: toolbarWidth }] = useMeasure<HTMLDivElement>()

    const { hwKind, setHwKind, searchQuery, setSearchQuery } = useContext(MainLayoutContext)!

    const _onChangeHwKind = (event: React.MouseEvent<HTMLElement>, newValue: string) => {
        if (newValue === 'all' || newValue === 'serial' || newValue === 'bluetooth') {
            setHwKind(newValue)
        }
    }

    const _onChangeSearchQuery = (event: React.ChangeEvent<HTMLInputElement>) => {
        console.log({ event, value: event.target.value })
        setSearchQuery(event.target.value)
    }

    const isNarrow = !toolbarWidth || toolbarWidth < 660
    const isVeryNarrow = !toolbarWidth || toolbarWidth < 500

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
                            onClick={onClickMenuButton}
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            sx={{
                                // ...(isSidebarOpen && { display: 'none' }),
                                marginRight: '16px',
                            }}
                        >
                            {isSidebarOpen ? <MenuOpenIcon htmlColor="#fff" /> : <MenuIcon htmlColor="#f0f0f0" />}
                        </IconButton>
                        <Typography variant="subtitle1" noWrap component="div" sx={{ fontSize: '1.0rem' }}>
                            {title}
                        </Typography>
                    </Box>

                    {!isVeryNarrow && (
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                            }}
                        >
                            <Paper
                                sx={{
                                    my: 0,
                                    display: 'inline-flex',
                                    p: 0,
                                    bgcolor: 'rgba(255,255,255,0.1)',
                                    border: (theme) => `1px solid ${theme.palette.divider}`,
                                    flexWrap: 'nowrap',
                                }}
                                elevation={0}
                            >
                                <StyledToggleButtonGroup
                                    size="small"
                                    value={hwKind}
                                    exclusive
                                    onChange={_onChangeHwKind}
                                    aria-label="text alignment"
                                >
                                    <ToggleButton value="all" aria-label="all">
                                        <RadioButtonCheckedIcon sx={{ fontSize: '1.1rem', mr: 1 }} /> 전체
                                    </ToggleButton>
                                    <ToggleButton value="serial" aria-label="serial">
                                        <UsbIcon sx={{ fontSize: '1.1rem', mr: 1 }} /> 시리얼
                                    </ToggleButton>
                                    <ToggleButton value="bluetooth" aria-label="bluetooth">
                                        <BluetoothIcon sx={{ fontSize: '1.1rem', mr: 1 }} /> 블루투스
                                    </ToggleButton>
                                </StyledToggleButtonGroup>
                            </Paper>
                        </Box>
                    )}

                    {!isNarrow && (
                        <Search>
                            <SearchIconWrapper>
                                <SearchIcon />
                            </SearchIconWrapper>
                            <StyledInputBase
                                placeholder="Search"
                                value={searchQuery ?? ''}
                                onChange={_onChangeSearchQuery}
                                inputProps={{ 'aria-label': 'search' }}
                            />
                        </Search>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    )
}
