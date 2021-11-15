import { HashRouter, Route, Switch } from 'react-router-dom'
import Home from './pages/home/HomePage'
import InspectSerialPage from './pages/inspect-serial/InspectSerialPage'
import InspectHidPage from './pages/inspect-hid/InspectHidPage'
import InfoPage from './pages/info/InfoPage'
import SettingsPage from './pages/settings/SettingsPage'
import BlockFactoryPage from './pages/block-factory/BlockFactoryPage'

const DATA = [
    { path: '/inspect-serial', comp: InspectSerialPage },
    { path: '/inspect-hid', comp: InspectHidPage },
    { path: '/info', comp: InfoPage },
    { path: '/settings', comp: SettingsPage },
    { path: '/block-factory', comp: BlockFactoryPage },
    { path: '/', comp: Home },
]

export default function App() {
    return (
        <HashRouter>
            <Switch>
                {DATA.map((item) => (
                    <Route key={item.path} path={item.path} exact={true} component={item.comp} />
                ))}
            </Switch>
        </HashRouter>
    )
}
