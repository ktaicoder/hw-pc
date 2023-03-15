import CloseIcon from '@mui/icons-material/Close'
import TerminalIcon from '@mui/icons-material/Terminal'
import { Box, Button, Container, Grid } from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { PulseLoader } from 'react-spinners'
import { interval } from 'rxjs'
import { IHwInfo, ISerialPortInfo, PcDriver } from 'src/custom-types/basic-types'
import Image from 'src/render/components/Image'
import { usePromiseValue } from 'src/render/util/useServiceValue'
import { IContext } from 'src/services/context/interface'
import { useHwServerState } from 'src/services/hw/useHwServerState'
import ConnectedMessageView from './components/ConnectedMessageView'
import ConsoleView from './components/ConsoleView'
import NotConnectedMessageView from './components/NotConnectedMessageView'
import PortsView from './components/PortsView'
import ToolbarView from './components/ToolbarView'
import TxRxView from './components/TxRxView'

type Props = {
  hwInfo: IHwInfo
}

type PcDriverMatched = {
  name: string
  uri: string
}

const filterPcDrivers = (platform: string, arch: string, pcDrivers: PcDriver[]): PcDriverMatched[] => {
  const driverKey = `${platform}-${arch}`
  return pcDrivers
    .filter((driver) => driver[driverKey])
    .map((driver) => {
      return { name: driver.name, uri: driver[driverKey] }
    })
}

function isNullish(t: any): boolean {
  if (t === undefined || t === null) return true
  return false
}

export default function DeviceSelectionView(props: Props) {
  const { hwInfo: info } = props
  const context = usePromiseValue<IContext | undefined>(async () => await window.service.context.getAll(), undefined)
  const [portInfos, setPortInfos] = useState<ISerialPortInfo[]>([])
  const [portInfo, setPortInfo] = useState<ISerialPortInfo>()
  const [refreshToken, setRefreshToken] = useState(0)
  const [consoleCollapsed, setConsoleCollapsed] = useState(true)

  const portCheckInterval = portInfos.length === 0 ? 5000 : 7000

  const pcDrivers = useMemo<PcDriverMatched[]>(() => {
    if (!context) return []
    return filterPcDrivers(context.platform, context.osArch, info.pcDrivers)
  }, [context, info.pcDrivers])

  const hwServerState = useHwServerState()

  const loadPorts = useCallback(async (hwId: string) => {
    const ports = await window.service.hw.serialPortList(hwId)
    setPortInfos(ports ?? [])
  }, [])

  useEffect(() => {
    const newPorts = portInfos
    const prevPort = portInfo
    if (newPorts.length > 0) {
      const found = prevPort ? newPorts.find((it) => it.path === prevPort.path) : undefined
      if (!found) {
        setPortInfo(newPorts[0])
      }
    } else {
      if (prevPort) {
        setPortInfo(undefined)
      }
    }
  }, [portInfo, portInfos])

  useEffect(() => {
    const hwId = info.hwId
    const s1 = interval(portCheckInterval).subscribe(() => {
      loadPorts(hwId)
    })
    return () => {
      s1.unsubscribe()
    }
  }, [info.hwId, loadPorts, portCheckInterval])

  useEffect(() => {
    if (!portInfo) {
      return
    }
    const hwId = info.hwId
    window.service.hw.selectSerialPort(hwId, portInfo.path)
  }, [info.hwId, portInfo])

  useEffect(() => {
    loadPorts(info.hwId)
  }, [refreshToken, loadPorts, info.hwId])

  const handleClickPort = (port: ISerialPortInfo) => {
    setPortInfo(port)
  }

  // 펌웨어 버튼 클릭
  const handleClickFirmwareDownload = () => {
    const firmwareFile = info.firmwareFile
    if (!firmwareFile) return
    window.service.hw.downloadDriver(firmwareFile)
  }

  // 드라이버 버튼 클릭
  const handleClickDriver = (driverPath: string) => {
    window.service.hw.downloadDriver(driverPath)
  }

  // 콘솔 열기/접기 버튼 클릭
  const handleClickConsoleCollapsedBtn = () => {
    setConsoleCollapsed((p) => !p)
  }

  const hwReady = hwServerState?.running === true && !isNullish(portInfo)

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'flex-start',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <ToolbarView
        hwId={info.hwId}
        hwName={typeof info.hwName === 'string' ? info.hwName : info.hwName.ko ?? info.hwName.en}
      />

      <Box
        sx={{
          position: 'relative',
          margin: '0 auto',
          width: '100%',
          maxWidth: 960,
        }}
        pt={10}
      >
        <Grid container sx={{ border: '0px solid red', flex: 0 }}>
          <Grid item xs={4} md={5}>
            <Box sx={{ position: 'relative' }}>
              <Image
                sx={{
                  minWidth: 180,
                  width: '100%',
                  height: '140px',
                  border: '0px solid #ccc',
                  objectFit: 'contain',
                }}
                src="static/images/computer.svg"
              />

              <Box sx={{ position: 'absolute', right: 0, top: 70 }}>
                <PulseLoader color="steelblue" loading={hwReady} size={8} margin={5} speedMultiplier={0.35} />
              </Box>
            </Box>
          </Grid>
          <Grid item xs={4} md={2}>
            <PortsView
              portInfos={portInfos}
              portPath={portInfo?.path}
              onClickPort={handleClickPort}
              onClickRefresh={() => setRefreshToken(Date.now())}
            />
          </Grid>
          <Grid item xs={4} md={5}>
            <Box sx={{ position: 'relative' }}>
              <Image
                sx={{
                  minWidth: 180,
                  width: '100%',
                  height: '140px',
                  border: '0px solid #ccc',
                  objectFit: 'contain',
                }}
                src={`static/images/devices/${info.hwId}.png`}
              />

              <Box sx={{ position: 'absolute', left: 0, top: 70 }}>
                <PulseLoader color="steelblue" loading={hwReady} size={8} margin={5} speedMultiplier={0.25} />
              </Box>
            </Box>
          </Grid>
          <Grid item xs={4} md={5}>
            <Box
              sx={{
                mt: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {pcDrivers.map((driver) => (
                <Button
                  key={driver.uri}
                  variant="contained"
                  sx={{ width: 180, height: 40 }}
                  onClick={() => handleClickDriver(driver.uri)}
                >
                  {driver.name}
                </Button>
              ))}
            </Box>
          </Grid>
          <Grid item xs={4} md={2}>
            {/* dummy */}
          </Grid>
          <Grid item xs={4} sm={4} md={5} lg={5}>
            <Box
              sx={{
                mt: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {info.firmwareFile && (
                <Button
                  variant="contained"
                  sx={{ width: 180, height: 40 }}
                  onClick={() => handleClickFirmwareDownload()}
                >
                  펌웨어 설치
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
        <Box mt={10}>
          <Container maxWidth="sm" disableGutters>
            {hwReady ? <ConnectedMessageView /> : <NotConnectedMessageView portCount={portInfos.length} />}
          </Container>
        </Box>
      </Box>
      <TxRxView
        sx={{
          position: 'absolute',
          top: 56,
          right: 16,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: 56,
          left: 16,
          //   right: 16,
          width: 'calc(100% - 32px)',
          height: 'calc(100% - 60px)',
          borderRadius: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transition: '0.3s',
          '& .ConsoleView-wrapper': {
            flex: 1,
            width: '100%',
            height: '100%',
            bgcolor: 'rgba(0,0,0,0.9)',
            px: 2,
            pt: 0,
            pb: 1,
            borderRadius: 1,
            overflow: 'hidden',
          },
          '&[data-is-closed="true"] .ConsoleView-wrapper': {
            height: 0,
            opacity: 0,
          },
          '&[data-is-closed="true"]': {
            transform: 'translateY(calc(100% - 40px))',
          },
        }}
        data-is-closed={consoleCollapsed}
      >
        <Button
          color={consoleCollapsed ? 'info' : 'error'}
          onClick={handleClickConsoleCollapsedBtn}
          variant="contained"
          size="small"
          startIcon={<TerminalIcon />}
          endIcon={consoleCollapsed ? undefined : <CloseIcon />}
        >
          {consoleCollapsed ? '콘솔 열기' : '콘솔 닫기'}
        </Button>

        <Box
          className="ConsoleView-wrapper"
          style={{
            position: 'relative',
            marginTop: '8px',
            border: '1px solid blue',
          }}
        >
          <ConsoleView />
        </Box>
      </Box>
    </Box>
  )
}
