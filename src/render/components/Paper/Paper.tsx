import { Paper, PaperProps } from '@mui/material'
import React from 'react'

interface Props {
    sx?: PaperProps['sx']
    squared?: boolean
    outlined?: boolean
}

const CustomPaper: React.FC<Props & PaperProps> = ({ sx, squared, outlined, children, ...rest }) => {
    return (
        <Paper
            {...rest}
            sx={{
                borderRadius: squared ? 0 : '4px',
                border: outlined ? 'none' : '1px solid #ddd',
                ...sx,
            }}
        >
            {children}
        </Paper>
    )
}

export default CustomPaper
