import { HashRouter, Route, Switch } from 'react-router-dom'
import Home from './pages/home/HomePage'
import InspectSerialPage from './pages/inspect-serial/InspectSerialPage'
import InspectHidPage from './pages/inspect-hid/InspectHidPage'
import InfoPage from './pages/info/InfoPage'
import SettingsPage from './pages/settings/SettingsPage'
import CodingpackPage from './pages/codingpack/CodingpackPage'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import OpenDocDialogEventHandler from './components/custom-event-handlers/OpenDocDialogEventHandler'
const DATA = [
    { path: '/inspect-serial', comp: InspectSerialPage },
    { path: '/inspect-hid', comp: InspectHidPage },
    { path: '/codingpack', comp: CodingpackPage },
    { path: '/info', comp: InfoPage },
    { path: '/settings', comp: SettingsPage },
    { path: '/', comp: Home },
]

export default function App() {
    return (
        <>
            <HashRouter>
                <Switch>
                    {DATA.map((item) => (
                        <Route key={item.path} path={item.path} exact={true} component={item.comp} />
                    ))}
                </Switch>
            </HashRouter>
            <OpenDocDialogEventHandler />
            <ToastContainer
                position="top-center"
                hideProgressBar={true}
                autoClose={3000}
                pauseOnHover={true}
                draggable={true}
            />
        </>
    )
}
