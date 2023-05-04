import MainLayout from 'src/render/layout/main'
import CodingpackHome from 'src/render/features/CodingpackHome'

export default function CodingpackPage() {
  return (
    <MainLayout title="코디니팩 설정">
      <CodingpackHome />
    </MainLayout>
  )
}
