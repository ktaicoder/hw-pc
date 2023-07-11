import Home from 'src/render/features/Home'
import MainLayout from 'src/render/layout/main'
import MainPageTopbar from '../components/MainPageTopbar'

export default function HomePage() {
  return (
    <MainLayout topBar={<MainPageTopbar />}>
      <Home />
    </MainLayout>
  )
}
