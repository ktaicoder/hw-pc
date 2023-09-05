import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { IHwInfo } from 'src/custom-types/basic-types'
import DeviceSelectionHome from 'src/render/features/DeviceSelectionHome'
import { HWID } from 'src/services/hw/types'

export default function DeviceSelectionPage() {
  const { hwId } = useParams()
  const [hwInfo, setHwInfo] = useState<IHwInfo>()

  const loadHwInfo = useCallback(async (hwId: HWID) => {
    const hw = await window.service.hw.findInfoById(hwId)
    setHwInfo(hw ?? undefined)
  }, [])

  useEffect(() => {
    if (hwId) {
      loadHwInfo(hwId as HWID)
    } else {
      setHwInfo(undefined)
    }
  }, [hwId, loadHwInfo])

  if (!hwInfo) return null

  return <DeviceSelectionHome hwInfo={hwInfo} />
}
