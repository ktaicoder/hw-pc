import InspectView from 'src/render/features/inspect/InspectView'
import MainLayout from 'src/render/layout/main/MainLayout'

export default function InspectSerialPage() {
  return (
    <MainLayout title="INSPECT">
      <InspectView hw="serial" />
    </MainLayout>
  )
}
