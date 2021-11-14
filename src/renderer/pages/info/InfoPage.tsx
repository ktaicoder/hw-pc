import InfoView from 'src/renderer/features/info/InfoView'
import MainLayout from 'src/renderer/layout/main'

export default function InfoPage() {
    return (
        <MainLayout title="정보">
            <InfoView />
        </MainLayout>
    )
}
