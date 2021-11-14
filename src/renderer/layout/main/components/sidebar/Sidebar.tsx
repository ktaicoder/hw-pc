import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Box, Divider, IconButton, List, ListItem, ListItemText, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { observer } from 'mobx-react'
import { useHistory } from 'react-router'
import { useLocation } from 'react-router-dom'
import Image from 'src/renderer/components/Image'
import hist from 'src/renderer/services/history'
import useStore from 'src/renderer/store/useStore'
import { SIDEMENU_FG_COLOR } from '../../main-layout-constants'
import { IMenu, isCurrentMenu, isCurrentSection, ISection, menus } from '../../sidebar-menu-define'
import DrawerHeader from '../drawer-header/DrawerHeader'
import MenuItem from './MenuItem'
import SectionMenu from './SectionMenu'

const ALL_MENUS = menus

function Sidebar() {
    const theme = useTheme()
    const { pathname: pathkey } = useLocation()
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
    const { sidebarStore } = useStore()
    const history = useHistory()
    const _onClickLink = () => {
        if (isMobile) {
            sidebarStore.setOpen(false)
        }
        // history.push("/inspect");
    }
    const isOpen = sidebarStore.isOpen

    return (
        <Box
            component="nav"
            sx={{
                color: SIDEMENU_FG_COLOR,
                '& > .MuiDivider-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    marginTop: 8,
                    marginBottom: 8,
                },
            }}
        >
            <DrawerHeader sx={{ pl: 2, pr: 1, color: 'primary.main', justifyContent: 'flex-start' }}>
                {/* <IconButton
                    size="small"
                    onClick={() => sidebarStore.toggleOpen()}
                    sx={{
                        color: SIDEMENU_FG_COLOR,
                    }}
                >
                    {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                </IconButton> */}

                <Image
                    component="img"
                    onClick={() => hist.push('/')}
                    sx={{ maxWidth: '80%', height: 22, objectFit: 'contain' }}
                    src="static/images/logo1.png"
                />
            </DrawerHeader>
            <List disablePadding>
                {ALL_MENUS.map((item, idx) => {
                    if (item.type === 'menu') {
                        return (
                            <MenuItem
                                key={idx}
                                menu={item as IMenu}
                                onLinkClick={_onClickLink}
                                active={isCurrentMenu(item.href, pathkey)}
                            />
                        )
                    } else if (item.type === 'divider') {
                        return <Divider key={idx} />
                    } else if (item.type === 'label') {
                        return (
                            <ListItem
                                key={idx}
                                sx={{
                                    pl: 2,
                                    '& .MuiListItemText-root .MuiTypography-root': {
                                        color: SIDEMENU_FG_COLOR,
                                        opacity: 0.8,
                                    },
                                }}
                                dense
                            >
                                <ListItemText>{item.title}</ListItemText>
                            </ListItem>
                        )
                    } else if (item.type === 'section') {
                        const section = item as ISection
                        return (
                            <SectionMenu
                                key={idx}
                                active={isCurrentSection(section.sectionId, pathkey)}
                                section={section}
                                currentHref={pathkey}
                                expanded={sidebarStore.expandedSectionIds.includes(section.sectionId)}
                                onClickLink={_onClickLink}
                                onClickSection={() => sidebarStore.toggleExpandSection(section.sectionId)}
                            />
                        )
                    } else {
                        return <div>{JSON.stringify(item)}</div>
                    }
                })}
            </List>
        </Box>
    )
}

export default observer(Sidebar)
