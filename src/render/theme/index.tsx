import { red } from '@mui/material/colors'
import { createTheme } from '@mui/material/styles'
import typography from './typography'
// Create a theme instance.
const theme = createTheme({
  typography,
  palette: {
    primary: {
      // main: '#007FFF',
      main: '#005CA2',
    },
    secondary: {
      main: '#ff5722',
    },
    error: {
      main: red.A400,
    },
    text: {
      primary: '#0A1929',
    },
  },
  components: {},
  mixins: {
    toolbar: {
      minHeight: 48,
      '@media (min-width:0px) and (orientation: landscape)': {
        minHeight: 48,
      },
      '@media (min-width:600px)': {
        minHeight: 48, // device 모드라서 높이를 줄이겠다
      },
    },
  },
})

export default theme
