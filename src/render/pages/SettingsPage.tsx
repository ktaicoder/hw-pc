import SettingsView from 'src/render/features/SettingsHome'
import MainLayout from 'src/render/layout/main'

export default function SettingsPage() {
  return (
    <MainLayout title="설정">
      <SettingsView />
    </MainLayout>
  )
}
