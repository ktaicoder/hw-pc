import { RouterProvider } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { appRouter } from './appRouter'
import OpenDocDialogEventHandler from './custom-events/OpenDocDialogEventHandler'

// const DATA = [
//   { path: '/inspect-serial', comp: InspectSerialPage },
//   { path: '/codingpack', comp: CodingpackPage },
//   { path: '/info', comp: InfoPage },
//   { path: '/settings', comp: SettingsPage },
//   { path: '/', comp: HomePage },
// ]

export default function App() {
  return (
    <>
      <RouterProvider router={appRouter} />
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
