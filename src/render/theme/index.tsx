import { createTheme } from '@mui/material/styles'
import { red, pink, purple } from '@mui/material/colors'

// Create a theme instance.
const theme = createTheme({
    typography: {
        fontFamily: [
            '"Noto Sans KR"',
            'Roboto',
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
            '"Apple Color Emoji"',
            '"Segoe UI Emoji"',
            '"Segoe UI Symbol"',
        ].join(','),
    },
    palette: {
        primary: {
            main: '#005CA2',
        },
        secondary: {
            main: '#f44336',
        },
        error: {
            main: pink.A700,
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
