import InspectView from 'src/renderer/features/inspect/InspectView'
import MainLayout from 'src/renderer/layout/main/MainLayout'

export default function InspectSerialPage() {
    return (
        <MainLayout title="INSPECT">
            <InspectView hw="serial" />
        </MainLayout>
    )
}
