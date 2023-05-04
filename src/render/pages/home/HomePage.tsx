import { Box } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { IHwInfo } from 'src/custom-types/basic-types'
import DeviceSelectionHome from 'src/render/features/DeviceSelectionHome'
import Home from 'src/render/features/Home'
import MainLayout from 'src/render/layout/main'
import { useHwServerState } from 'src/services/hw/useHwServerState'
import './style.css'

export default function HomePage() {
  const [hwInfo, setHwInfo] = useState<IHwInfo>()
  const hwServerState = useHwServerState()

  const loadHwInfo = useCallback(async (hwId: string) => {
    const hw = await window.service.hw.findInfoById(hwId)
    setHwInfo(hw ?? undefined)
  }, [])

  useEffect(() => {
    const hwId = hwServerState?.hwId
    if (hwId && hwId !== 'codingpack') {
      loadHwInfo(hwId)
    } else {
      setHwInfo(undefined)
    }
  }, [hwServerState, loadHwInfo])

  if (!hwInfo) {
    return (
      <MainLayout title="장치 연결" isMainPage={true}>
        <Home />
      </MainLayout>
    )
  }

  return (
    <Box>
      <DeviceSelectionHome hwInfo={hwInfo} />
    </Box>
  )
}
