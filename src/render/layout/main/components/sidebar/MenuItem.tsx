import { ListItem, ListItemIcon, ListItemText } from '@mui/material'
import React from 'react'
import {
    ICON_COLOR,
    ICON_COLOR_ACTIVE,
    SIDEMENU_BG_COLOR_ACTIVE,
    SIDEMENU_BG_COLOR_HOVER,
    SIDEMENU_BORDER_COLOR_ACTIVE,
    SIDEMENU_FG_COLOR,
    SIDEMENU_FG_COLOR_ACTIVE,
} from '../../main-layout-constants'
import { IMenu } from '../../sidebar-menu-define'
import Link, { LinkProps } from './Link'
import MenuIcon from './MenuIcon'
type Props = {
    menu: IMenu
    active: boolean
    onLinkClick?: (href: string) => void
}

const MyLink = React.forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => <Link {...props} />)

export default function MenuItem(props: Props) {
    const { menu, active, onLinkClick } = props
    const { icon, title, href } = menu

    return (
        <ListItem
            component={MyLink}
            href={href}
            to={href}
            replace
            onClick={() => onLinkClick?.(href)}
            sx={{
                display: 'flex',
                paddingLeft: `${active ? 20 : 24}px`,
                pr: 1,
                '&:hover': {
                    backgroundColor: SIDEMENU_BG_COLOR_HOVER,
                },

                '& .MuiListItemIcon-root': {
                    color: active ? ICON_COLOR_ACTIVE : ICON_COLOR,
                },
                '& .MuiListItemText-root': {
                    color: active ? SIDEMENU_FG_COLOR_ACTIVE : SIDEMENU_FG_COLOR,
                    fontWeight: active ? 700 : 500,
                    '& .MuiListItemText-primary': {
                        fontSize: '0.85rem',
                    },
                },

                ...(active && {
                    backgroundColor: SIDEMENU_BG_COLOR_ACTIVE,
                    borderLeft: `4px solid ${SIDEMENU_BORDER_COLOR_ACTIVE}`,
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                }),
            }}
        >
            {icon && (
                <ListItemIcon>
                    <MenuIcon iconName={icon} />
                </ListItemIcon>
            )}
            <ListItemText primary={title} />
        </ListItem>
    )
}
