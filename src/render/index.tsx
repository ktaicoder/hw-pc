import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import ReactDOM from 'react-dom'
import 'src/electron-ipc-cat/fixContextIsolation'
import { WindowNames } from 'src/services/windows/WindowProperties'
import RouteByWindowName from './RouteByWindowName'
import StoreProvider from './store/StoreProvider'
import theme from './theme'

function render(windowName: WindowNames) {
  ReactDOM.render(
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <StoreProvider>
        <RouteByWindowName windowName={windowName} />
      </StoreProvider>
    </ThemeProvider>,
    document.querySelector('#root'),
  )
}

export async function runApp() {
  if (window.meta.windowName !== WindowNames.main) {
    // document.addEventListener('keydown', (_event) => {
    //     void (async () => {
    //         const { preventClosingWindow } = (await window.service.window.getWindowMeta(
    //             WindowNames.preferences,
    //         )) as IPreferenceWindowMeta
    //         if (window?.meta?.windowName === WindowNames.preferences && preventClosingWindow) {
    //             return
    //         }
    //         void window?.remote?.closeCurrentWindow?.()
    //     })()
    // })
  }
  render(window.meta.windowName)
}
