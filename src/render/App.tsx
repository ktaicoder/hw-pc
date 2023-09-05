import { RouterProvider } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { appRouter } from './appRouter'
import LightboxImageViewEventHandler from './custom-events/LightboxImageViewEventHandler'
import OpenDocDialogEventHandler from './custom-events/OpenDocDialogEventHandler'

export default function App() {
  return (
    <>
      <RouterProvider router={appRouter} />
      <ToastContainer
        position="top-center"
        hideProgressBar
        autoClose={3000}
        pauseOnHover
        draggable
      />
      <LightboxImageViewEventHandler />
      <OpenDocDialogEventHandler />
    </>
  )
}
