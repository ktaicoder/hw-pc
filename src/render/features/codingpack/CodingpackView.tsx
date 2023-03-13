import { useCallback, useEffect, useState } from 'react'
import { useUnmount } from 'react-use'
import { IHwInfo } from 'src/custom-types/basic-types'
import { useHwServerState } from 'src/services/hw/useHwServerState'
import CodingpackInternalView from './CodingpackInternalView'

const CODINGPACK_HW_ID = 'codingpack'

export default function CodingpackView() {
  const [info, setInfo] = useState<IHwInfo>()
  const [loadingState, setLoadingState] = useState<'first' | 'loading' | 'loaded' | 'error'>('first')
  const [selected, setSelected] = useState(false)

  const hwServerState = useHwServerState()
  const hwServerRunning = hwServerState?.running === true

  const loadInfo = useCallback(async () => {
    setLoadingState('loading')
    const info = await window.service.hw.findInfoById(CODINGPACK_HW_ID)
    setLoadingState(info ? 'loaded' : 'error')
    setInfo(info ?? undefined)
  }, [])

  useEffect(() => {
    loadInfo()
  }, [loadInfo])

  useUnmount(() => {
    window.service.hw.unselectHw('')
  })

  useEffect(() => {
    if (!info) return
    if (selected) return
    window.service.hw.selectHw(info.hwId)
    setSelected(true)
  }, [info, selected])

  if (!info || !selected || !hwServerRunning) {
    return (
      <div>
        {(loadingState === 'first' || loadingState === 'loading') && <div>loading</div>}
        {loadingState === 'loaded' && <div>loaded</div>}
        {loadingState === 'error' && <div>error</div>}
      </div>
    )
  }

  return <CodingpackInternalView hwInfo={info} />
}
