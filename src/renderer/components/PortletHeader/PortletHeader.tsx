import { Box } from '@mui/material'
import { SxProps } from '@mui/system'

interface Props {
    sx?: SxProps
    noDivider?: boolean
    noPadding?: boolean
    children?: React.ReactChild
}

const PortletFooter: React.FC<Props> = ({ children, noDivider, noPadding, sx }) => {
    return (
        <Box
            sx={{
                ...sx,
                position: 'relative',
                alignItems: 'center',
                borderBottom: noDivider ? 'none' : '1px solid #ddd',
                borderTopLeftRadius: 2,
                borderTopRightRadius: 2,
                height: 64,
                display: 'flex',
                justifyContent: 'space-between',
                ...(noPadding ? { p: 0 } : { pl: 3, pr: 1 }),
            }}
        >
            {children}
        </Box>
    )
}

export default PortletFooter
