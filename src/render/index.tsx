import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { createRoot } from 'react-dom/client'
import 'src/electron-ipc-cat/fixContextIsolation'
import StoreProvider from 'src/render/lib/store/StoreProvider'
import { WindowNames } from 'src/services/windows/WindowProperties'
import RouteByWindowName from './RouteByWindowName'
import theme from './theme'

const root = createRoot(document.querySelector('#root')!)

function render(windowName: WindowNames) {
  root.render(
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <StoreProvider>
        <RouteByWindowName windowName={windowName} />
      </StoreProvider>
    </ThemeProvider>,
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
