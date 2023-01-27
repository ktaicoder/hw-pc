import { Box } from '@mui/system'
import { useMeasure } from 'react-use'
import { fixWebPath } from 'src/render/util/fixWebPath'

export default function BlockFactoryView() {
  const [ref, { height: frameHeight }] = useMeasure<HTMLDivElement>()
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        '& iframe': {
          flexGrow: 1,
          minWidth: 1000,
          width: '100%',
          minHeight: '100%',
          overflow: 'auto',
        },
      }}
    >
      {/* <iframe src="https://blockly-demo.appspot.com/static/demos/blockfactory/index.html"></iframe> */}
      <iframe src={fixWebPath('blockfactory/index.html')}></iframe>
    </Box>
  )
}
