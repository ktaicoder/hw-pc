import BlockFactoryView from 'src/render/features/block-factory/BlockFactoryView'
import MainLayout from 'src/render/layout/main'

export default function BlockFactoryPage() {
    return (
        <MainLayout title="블록">
            <BlockFactoryView />
        </MainLayout>
    )
}
