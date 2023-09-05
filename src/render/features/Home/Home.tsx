import RefreshIcon from '@mui/icons-material/Refresh'
import { Box, Grid, IconButton } from '@mui/material'
import ToggleButton from '@mui/material/ToggleButton'
import Tooltip from '@mui/material/Tooltip'
import { useCallback, useContext, useEffect, useState } from 'react'
import { useMeasure, useMount } from 'react-use'
import { IHwInfo } from 'src/custom-types/basic-types'
import { useHwInfoList } from 'src/render/hooks/useHwInfoList'
import { useMoveDetailsWhenSelected } from 'src/render/hooks/useMoveDetailsWhenSelected'
import MainLayoutContext from 'src/render/layout/main/MainLayoutContext'
import DeviceGridItem from './components/DeviceGridItem'
import NoticeView from './components/NoticeView'
import StyledToggleButtonGroup from './components/StyledToggleButtonGroup'

type SearchOption = {
  category: 'all' | 'robot' | 'module' | 'board'
}
const DEFAULT_SEARCH_OPTION: SearchOption = {
  category: 'all',
}

const getHwName = (info: IHwInfo): string => {
  if (typeof info.hwName === 'string') {
    return info.hwName
  }
  return Object.values(info.hwName)[0]
}

export default function Home() {
  const [contentDivRef, { width: contentWidth }] = useMeasure<HTMLDivElement>()
  const [allDeviceList, favorHwIds, refresh, toggleFavor] = useHwInfoList({ withTerminal: false })
  const [option, setOption] = useState<SearchOption>(DEFAULT_SEARCH_OPTION)
  const { hwKind, searchQuery } = useContext(MainLayoutContext)!
  const [deviceList, setDeviceList] = useState<IHwInfo[]>([])

  useMount(() => {
    window.service.hw.stopServer()
  })

  useMoveDetailsWhenSelected()

  const handleChangeDeviceType = (event: React.MouseEvent<HTMLElement>, deviceType: string) => {
    const newValue = deviceType as SearchOption['category']
    setOption((p) => ({ ...p, category: newValue }))
  }

  const handleClickFavor = (hwId: string) => {
    toggleFavor(hwId)
  }

  const filterDeviceList = useCallback(
    async (
      searchQuery: string | undefined,
      category: SearchOption['category'],
      hwKind: 'all' | 'serial' | 'bluetooth',
      allDeviceList: IHwInfo[],
    ) => {
      if (!searchQuery && category === 'all' && hwKind === 'all') {
        setDeviceList(allDeviceList)
        return
      }
      const query = searchQuery?.toLocaleLowerCase() ?? ''

      setDeviceList(
        allDeviceList
          .filter((it) => hwKind === 'all' || it.hwKind === hwKind)
          .filter((it) => category === 'all' || it.category === category)
          .filter((it) => {
            if (query.length === 0) return true
            const hwName = getHwName(it)
            return hwName.toLocaleLowerCase().includes(query)
          }),
      )
    },
    [],
  )

  useEffect(() => {
    filterDeviceList(searchQuery, option.category, hwKind, allDeviceList)
  }, [searchQuery, option, hwKind, allDeviceList, filterDeviceList])

  // 하드웨어 클릭
  const handleClickHw = (info: IHwInfo) => {
    window.service.hw.selectHw(info.hwId)
  }

  return (
    <Box
      sx={{
        position: 'relative',
        flexGrow: 1,
        px: 2,
        pb: '120px',
        display: 'flex',
        border: '0px solid red',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          position: 'fixed',
          zIndex: (theme) => theme.zIndex.appBar,
          width: contentWidth,
        }}
      >
        <Box
          sx={{
            px: 0,
            py: 0,
            width: '100%',
            display: 'flex',
            minHeight: 48,
            flexWrap: 'nowrap',
            position: 'relative',
          }}
        >
          <Box
            sx={{
              display: 'inline-flex',
              position: 'absolute',
              left: '50%',
              top: '50%',
              background: (theme) => theme.palette.background.paper,
              transform: 'translate(-50%, -50%)',
              border: (theme) => `0px solid ${theme.palette.divider}`,
              flexWrap: 'nowrap',
            }}
          >
            <StyledToggleButtonGroup
              size="small"
              value={option.category}
              color="primary"
              onChange={handleChangeDeviceType}
              exclusive
              aria-label="hardware type"
            >
              <ToggleButton value="all" aria-label="all">
                전체
              </ToggleButton>
              <ToggleButton value="robot" aria-label="robot">
                로봇형
              </ToggleButton>
              <ToggleButton value="module" aria-label="module">
                모듈형
              </ToggleButton>
              <ToggleButton value="board" aria-label="board">
                보드형
              </ToggleButton>
            </StyledToggleButtonGroup>
          </Box>
          <Tooltip title="새로고침">
            <IconButton
              sx={{ width: 48, height: 48, position: 'absolute', top: 0, right: 0, mt: 1.8 }}
              onClick={() => refresh()}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Box sx={{ flexGrow: 1, py: 1, mt: 9, position: 'relative' }} ref={contentDivRef}>
        <Grid container rowSpacing={2} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
          {deviceList.map((device, i) => (
            <Grid item lg={3} md={4} sm={6} xs={12} key={device.hwId}>
              <DeviceGridItem
                info={device}
                star={favorHwIds.has(device.hwId)}
                onClick={handleClickHw}
                onClickFavor={handleClickFavor}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
      <NoticeView />
    </Box>
  )
}
