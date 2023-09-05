import { Box, Divider, List, ListItem, ListItemText, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { observer } from 'mobx-react'
import { useLocation, useNavigate } from 'react-router-dom'
import Image from 'src/render/components/Image'
import { nav } from 'src/render/lib/nav'
import { useStore } from 'src/render/lib/store/useStore'
import { sideMenuManager } from 'src/render/sidebar-menus'
import { SIDEMENU_FG_COLOR } from '../../main-layout-constants'
import DrawerHeader from '../DrawerHeader'
import SideMenuItem from './SideMenuItem'
import SideSectionMenu from './SideSectionMenu'

function Sidebar() {
  const theme = useTheme()
  const navigate = useNavigate()
  const { pathname: pathkey } = useLocation()
  const smOrDown = useMediaQuery(theme.breakpoints.down('md'))
  const { sidebarStore } = useStore()

  const handleClickMenu = (menu: nav.IMenu) => (e: React.MouseEvent) => {
    console.log('navigate=', menu.href)
    if (smOrDown) {
      sidebarStore.toggleOpen(false)
    }
    navigate(menu.href)
  }

  return (
    <Box
      className="Sidebar-root"
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
      <DrawerHeader
        sx={{
          pl: 2,
          pr: 1,
          color: 'primary.main',
          justifyContent: 'flex-start',
        }}
      >
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
          onClick={() => navigate('/', { replace: true })}
          sx={{ maxWidth: '80%', height: 20, objectFit: 'contain' }}
          src="/static/images/logo_white.png"
        />
      </DrawerHeader>
      <List disablePadding sx={{ pt: '2px' }}>
        {sideMenuManager.menuItems.map((item, idx) => {
          if (item.type === 'menu') {
            return (
              <SideMenuItem
                key={idx}
                className="Sidebar-sideMenuItem"
                icon={item.icon}
                title={item.title}
                onClick={handleClickMenu(item)}
                active={sideMenuManager.isMenuPathMatched(item, pathkey)}
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
            const section = item
            return (
              <SideSectionMenu
                key={idx}
                section={section}
                currentHref={pathkey}
                expanded={sidebarStore.expandedSectionIds.includes(section.sectionId)}
                onClickMenu={handleClickMenu}
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
