import { ListItemButton, ListItemIcon, ListItemText, SxProps } from '@mui/material'
import clsx from 'clsx'
import * as React from 'react'
import { flatSx } from 'src/render/util/sx-props'
import { ICON_COLOR, ICON_COLOR_ACTIVE, SIDEMENU_FG_COLOR, SIDEMENU_FG_COLOR_ACTIVE } from '../../main-layout-constants'

type Props = {
  sx?: SxProps
  className?: string
  icon?: React.ReactNode
  title: string
  active: boolean
  onClick: (event: React.MouseEvent) => void
}

export default function MenuItem(props: Props) {
  const { sx, className, icon, title, active, onClick } = props

  return (
    <ListItemButton
      onClick={onClick}
      className={clsx('SideMenuItem-root', className, {
        'Mui-active': active,
      })}
      sx={flatSx(
        {
          display: 'flex',
          paddingLeft: `${active ? 20 : 24}px`,
          pr: 1,
          '&:hover': {
            backgroundColor: active ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.1)',
          },

          '& .MuiListItemIcon-root': {
            color: active ? ICON_COLOR_ACTIVE : ICON_COLOR,

            ml: active ? '-16px' : 0,
          },
          '& .MuiListItemText-root': {
            color: active ? SIDEMENU_FG_COLOR_ACTIVE : SIDEMENU_FG_COLOR,

            fontWeight: active ? 700 : 500,
            '& .MuiListItemText-primary': {
              fontSize: '0.85rem',
            },
          },

          ...(active && {
            // backgroundColor: SIDEMENU_BG_COLOR_ACTIVE,
            backgroundColor: '#fff',
            ml: '4px',
            // borderLeft: `4px solid ${SIDEMENU_BORDER_COLOR_ACTIVE}`,
            borderLeft: '16px solid transparent',
            borderTopLeftRadius: '24px',
            borderBottomLeftRadius: '24px',
          }),
        },
        sx,
      )}
    >
      {icon && <ListItemIcon>{icon}</ListItemIcon>}
      <ListItemText primary={title} />
    </ListItemButton>
  )
}
