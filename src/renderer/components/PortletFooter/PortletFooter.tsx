import { Box } from '@mui/material'
import { SxProps } from '@mui/system'

interface Props {
    sx?: SxProps
    noDivider?: boolean
}

const PortletFooter: React.FC<Props> = ({ noDivider, sx, children }) => {
    return (
        <Box
            sx={{
                py: 1,
                px: 2,
                borderTop: noDivider ? 'none' : '1px solid #ddd',
                borderBottomLeftRadius: '2px',
                borderBottomRightRadius: '2px',
                ...sx,
            }}
        >
            {children}
        </Box>
    )
}

export default PortletFooter
