import CloseIcon from '@mui/icons-material/Close'
import { Box, IconButton, SxProps, Typography } from '@mui/material'
import clsx from 'clsx'
import * as React from 'react'
import { flatSx } from '../util/sx-props'

type Props = {
  sx?: SxProps
  style?: React.CSSProperties
  title?: React.ReactNode
  onClose?: (event: React.MouseEvent) => void
  size?: 'small' | 'medium'
  children?: React.ReactNode
}

const CustomDialogTitle = React.forwardRef<HTMLDivElement, Props>((props: Props, ref): JSX.Element => {
  const { sx, style, title, size = 'small', onClose, children } = props

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      ref={ref}
      className={clsx('CustomDialogTitle-root', {
        'CustomDialogTitle-medium': size === 'medium',
        'CustomDialogTitle-small': size === 'small',
      })}
      sx={flatSx(
        {
          pr: 1,
          pl: {
            xs: 2,
            md: 3,
          },
          minHeight: 40,
          '&.CustomDialogTitle-medium': {
            minHeight: 52,
          },
          '&.CustomDialogTitle-small': {
            minHeight: 48,
          },
        },
        sx,
      )}
      style={style}
    >
      <Box display="flex" alignItems="center" sx={{ flex: 1 }}>
        {title &&
          (typeof title === 'string' ? (
            <Typography variant={size === 'small' ? 'h6' : 'h5'}>{title}</Typography>
          ) : (
            title
          ))}
        {children}
      </Box>
      {onClose && (
        <IconButton onClick={onClose} size="small" sx={{ ml: 3 }} color="inherit">
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  )
})

CustomDialogTitle.displayName = 'CustomDialogTitle'
export default CustomDialogTitle
