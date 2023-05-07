import { nav } from '@cp949/mui-common'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import {
  Collapse,
  Divider,
  List,
  ListItemIcon,
  ListItemText,
  ListItemButton as MuiListItemButton,
  ListItemButtonProps as MuiListItemButtonProps,
  styled,
} from '@mui/material'
import clsx from 'clsx'
import { sideMenuManager } from 'src/render/sidebar-menus'
import {
  DIVIDER_COLOR,
  ICON_COLOR,
  ICON_COLOR_ACTIVE,
  SIDEMENU_BG_COLOR_HOVER,
  SIDEMENU_FG_COLOR,
} from '../../main-layout-constants'
import SideMenuItem from './SideMenuItem'

type Props = {
  section: nav.ISection
  expanded: boolean
  currentHref?: string
  indent?: boolean
  onClickSection?: (e: React.MouseEvent) => void
  onClickMenu: (menu: nav.IMenu) => (e: React.MouseEvent) => void
}
const ListItemButton = styled(MuiListItemButton, {
  shouldForwardProp: (p) => p !== 'active',
})<MuiListItemButtonProps & { active: boolean }>(({ theme, active }) => {
  return {
    '&:hover': {
      backgroundColor: SIDEMENU_BG_COLOR_HOVER,
    },
    '& .MuiListItemText-root': {
      color: SIDEMENU_FG_COLOR,
      marginLeft: theme.spacing(1),
    },
    '& .MuiListItemIcon-root': {
      color: ICON_COLOR,
    },
    ...(active && {
      borderTop: `1px solid ${DIVIDER_COLOR}`,
      backgroundColor: 'rgba(0, 0, 0, 0)',
    }),

    '& .MuiIcon-root.sectionIndicator': {
      color: active ? ICON_COLOR_ACTIVE : 'rgba(255,255,255,0.5)',
      marginRight: theme.spacing(1),
    },

    '& + &': {
      marginBottom: theme.spacing(1),
      marginTop: theme.spacing(1),
    },
  }
})

export default function SideSectionMenu(props: Props) {
  const { section, onClickSection, expanded = false, currentHref, onClickMenu } = props

  return (
    <>
      <ListItemButton
        active={sideMenuManager.isSectionPathMatched(section, currentHref)}
        onClick={onClickSection}
        className={clsx('SideSectionMenu-root', {
          'SideSectionMenu-expanded': expanded, // 현재 섹션이 펼쳐진 상태
        })}
      >
        {section.icon && <ListItemIcon>{section.icon}</ListItemIcon>}
        <ListItemText primary={section.title} />
        {expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
      </ListItemButton>
      <Collapse
        in={expanded}
        timeout="auto"
        unmountOnExit
        sx={{
          boxSizing: 'border-box',
          borderBottom: `1px solid ${DIVIDER_COLOR}`,

          '& .MuiCollapse-wrapper .MuiListItem-root': {
            pl: 6,
          },
        }}
      >
        <List disablePadding>
          {section.submenus?.map((menu, idx) => {
            if (menu.type === 'divider') {
              return <Divider key={idx} />
            }
            return (
              <SideMenuItem
                key={menu.id}
                icon={menu.icon}
                title={menu.title}
                sx={{ pl: 6 }}
                onClick={onClickMenu(menu)}
                active={sideMenuManager.isMenuPathMatched(menu, currentHref)}
              />
            )
          })}
        </List>
      </Collapse>
    </>
  )
}
