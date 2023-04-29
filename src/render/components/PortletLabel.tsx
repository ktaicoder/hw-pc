import { Box, Typography } from '@mui/material'
import { SxProps } from '@mui/system'
import React, { HTMLAttributes, ReactNode } from 'react'

interface Props extends HTMLAttributes<HTMLDivElement> {
  sx?: SxProps
  icon?: ReactNode
  title?: string
  subtitle?: string
}

/**
 * @param param0
 * @returns
 */
const PortletLabel = React.forwardRef<HTMLDivElement, Props>((props, ref) => {
  const { icon, title, subtitle, sx } = props
  return (
    <Box
      ref={ref}
      sx={{
        display: 'flex',
        alignItems: 'center',
        ...sx,
      }}
    >
      {icon && (
        <Box
          component="span"
          sx={{
            fontSize: '1.2rem',
            mr: 1,
            color: 'text.secondary',
            alignItems: 'center',
            display: 'flex',
          }}
        >
          {icon}
        </Box>
      )}
      {title && (
        <Typography
          sx={{
            fontWeight: 500,
            fontSize: '1.1rem',
          }}
          variant="h6"
        >
          {title}
        </Typography>
      )}
      {subtitle && (
        <Typography
          variant="subtitle2"
          sx={{
            fontWeight: 400,
            ml: 1,
            color: 'text.secondary',
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  )
})

PortletLabel.displayName = 'PortletLabel'

export default PortletLabel
