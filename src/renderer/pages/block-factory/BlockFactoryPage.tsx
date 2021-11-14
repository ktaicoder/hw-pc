import BlockFactoryView from 'src/renderer/features/block-factory/BlockFactoryView'
import MainLayout from 'src/renderer/layout/main'

export default function BlockFactoryPage() {
    return (
        <MainLayout title="블록">
            <BlockFactoryView />
        </MainLayout>
    )
}
