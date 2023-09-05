import { Box, BoxProps } from '@mui/material'
import { fixWebPath } from '../util/fixWebPath'

export default function Image(props: BoxProps<'img'>) {
  const { src, alt = '', ...restProps } = props

  return <Box {...restProps} component="img" src={fixWebPath(src)} alt={alt} />
}
