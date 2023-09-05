import 'src/electron-ipc-cat/fixContextIsolation'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { createRoot } from 'react-dom/client'
import theme from './theme'
import App from './App'
import { StoreProvider } from './lib/store/StoreProvider'

const root = createRoot(document.querySelector('#root')!)

export function runApp() {
  root.render(
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <StoreProvider>
        <App />
      </StoreProvider>
    </ThemeProvider>,
  )
}

runApp()
