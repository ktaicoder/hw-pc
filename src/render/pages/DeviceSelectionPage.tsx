import { Box } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { IHwInfo } from 'src/custom-types/basic-types'
import DeviceSelectionHome from 'src/render/features/DeviceSelectionHome'

export default function DeviceSelectionPage() {
  const { hwId } = useParams()
  const [hwInfo, setHwInfo] = useState<IHwInfo>()

  const loadHwInfo = useCallback(async (hwId: string) => {
    const hw = await window.service.hw.findInfoById(hwId)
    setHwInfo(hw ?? undefined)
  }, [])

  useEffect(() => {
    if (hwId && hwId !== 'codingpack') {
      loadHwInfo(hwId)
    } else {
      setHwInfo(undefined)
    }
  }, [hwId, loadHwInfo])

  if (!hwInfo) return null

  return <DeviceSelectionHome hwInfo={hwInfo} />
}
