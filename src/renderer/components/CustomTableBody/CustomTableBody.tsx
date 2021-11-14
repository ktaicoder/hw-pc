import { TableBody as MuiTableBody, TableBodyProps } from '@mui/material'

type Props = {
    loading?: boolean
    stripe?: boolean
} & TableBodyProps

export default function CustomTableBody(props: Props) {
    const { loading, stripe, ...otherProps } = props

    return (
        <MuiTableBody
            sx={{
                opacity: loading ? 0.5 : 1,
                '& .MuiTableRow-root:nth-of-type(odd)': {
                    bgcolor: stripe ? 'action.hover' : 'inherit',
                },
            }}
            {...otherProps}
        />
    )
}
