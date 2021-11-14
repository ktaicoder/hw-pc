import { Box } from '@mui/material'

interface Props {
    noPadding?: boolean
}

const PortletContent: React.FC<Props> = ({ noPadding, children }) => {
    return (
        <Box
            sx={{
                ...(noPadding ? { p: 0 } : { px: 3, py: 2 }),
                flexGrow: 1,
            }}
        >
            {children}
        </Box>
    )
}

export default PortletContent
