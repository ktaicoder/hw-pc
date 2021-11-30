import MainLayout from 'src/render/layout/main'
import CodingpackView from 'src/render/features/codingpack/CodingpackView'

export default function CodingpackPage() {
    return (
        <MainLayout title="코딩팩">
            <CodingpackView />
        </MainLayout>
    )
}
