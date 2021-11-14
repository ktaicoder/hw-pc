import { Box, BoxProps } from '@mui/material'
import { useMemo } from 'react'
import { fixWebPath } from 'src/renderer/util/fixWebPath'

export default function Image(props: BoxProps<'img'>) {
    const { src, alt = '', ...restProps } = props
    const fixedSrc = useMemo(() => fixWebPath(src), [src])

    return <Box {...restProps} component="img" src={fixedSrc} alt={alt} />
}
