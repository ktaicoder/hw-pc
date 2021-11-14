import { useCallback, useEffect, useState } from 'react'
import { IHwInfo } from 'src/custom-types/hw-types'
import DeviceSelectionView from 'src/renderer/features/device-selection/DeviceSelectionView'
import MainDevices from 'src/renderer/features/main-devices/MainDevices'
import MainLayout from 'src/renderer/layout/main'
import { useHwServerState } from 'src/services/hw/hook'

export default function Home() {
    const [hwInfo, setHwInfo] = useState<IHwInfo>()
    const hwServerState = useHwServerState()

    const loadHwInfo = useCallback(async (hwId: string) => {
        const hw = await window.service.hw.findInfoById(hwId)
        setHwInfo(hw)
    }, [])

    useEffect(() => {
        const hwId = hwServerState?.hwId
        if (hwId) {
            loadHwInfo(hwId)
        } else {
            setHwInfo(undefined)
        }
    }, [hwServerState?.hwId])

    console.log('HOME Compoent Render', { hwInfo })
    return hwInfo ? (
        <DeviceSelectionView hwInfo={hwInfo} />
    ) : (
        <MainLayout title="장치 연결" isMainPage={true}>
            <MainDevices />
        </MainLayout>
    )
}
