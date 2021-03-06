import MainLayout from 'src/render/layout/main'
import CodingpackView from 'src/render/features/codingpack/CodingpackView'

export default function CodingpackPage() {
    return (
        <MainLayout title="코디니팩 설정">
            <CodingpackView />
        </MainLayout>
    )
}
