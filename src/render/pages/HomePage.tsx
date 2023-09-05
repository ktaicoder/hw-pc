import MainPageTopbar from '../components/MainPageTopbar'
import MainLayout from '../layout/main/MainLayout'
import Home from 'src/render/features/Home'

export default function HomePage() {
  return (
    <MainLayout topBar={<MainPageTopbar />}>
      <Home />
    </MainLayout>
  )
}
