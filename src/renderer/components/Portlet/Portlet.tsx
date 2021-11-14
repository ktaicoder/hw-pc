import { PaperProps } from '@mui/material'
import Paper from '../Paper'

/**
 * @component
 */
const Portlet = ({ children, ...rest }: PaperProps) => {
    return (
        <Paper {...rest} elevation={0} outlined squared={false} sx={{ display: 'flex', flexDirection: 'column' }}>
            {children}
        </Paper>
    )
}

export default Portlet
