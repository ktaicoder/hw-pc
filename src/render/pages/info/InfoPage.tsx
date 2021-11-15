import InfoView from 'src/render/features/info/InfoView'
import MainLayout from 'src/render/layout/main'

export default function InfoPage() {
    return (
        <MainLayout title="정보">
            <InfoView />
        </MainLayout>
    )
}
