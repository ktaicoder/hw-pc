import { WindowNames } from 'src/services/windows/WindowProperties'
import App from './App'
import AboutPage from './pages/about/AboutPage'
import PreferencesPage from './pages/preferences/PreferencesPage'

type Props = {
    windowName: WindowNames
}

export default function RouteByWindowName({ windowName }: Props) {
    if (windowName === WindowNames.about) {
        return <AboutPage />
    } else if (windowName === WindowNames.preferences) {
        return <PreferencesPage />
    }
    return <App />
}
