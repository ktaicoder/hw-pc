import SettingsView from 'src/renderer/features/settings/SettingsView'
import MainLayout from 'src/renderer/layout/main'

export default function SettingsPage() {
    return (
        <MainLayout title="설정">
            <SettingsView />
        </MainLayout>
    )
}
