import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { Alert, Box, Button, Container, Grid, Stack } from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { PulseLoader } from 'react-spinners'
import { toast } from 'react-toastify'
import { useUnmount } from 'react-use'
import { interval } from 'rxjs'
import { PortInfo } from 'serialport'
import { IHwInfo, PcDriver } from 'src/custom-types/hw-types'
import { CodingpackActionKindKey } from 'src/domain/codingpack'
import Image from 'src/render/components/Image'
import CodingpackActionDialog, { CodingpackActionDialogProps } from 'src/render/dialogs/CodingpackActionDialog'
import { CustomEvents } from 'src/render/lib/CustomEvents'
import { usePromiseValue } from 'src/render/util/useServiceValue'
import { IContext } from 'src/services/context/interface'
import { useHwServerState } from 'src/services/hw/hook'
import PortsView from '../device-selection/components/ports/PortsView'
import { CodingpackActions } from './codingpack-actions'
import CodingpackActionRow from './components/CodingpackActionRow'

type Props = {
    hwInfo: IHwInfo
}

type PcDriverMatched = {
    name: string
    uri: string
}

// 블루투스 설정은 감춘다
const DISABLED_KIND: CodingpackActionKindKey[] = ['bluetooth']

function isNullish(t: any): boolean {
    if (t === undefined || t === null) return true
    return false
}

const filterPcDrivers = (platform: string, arch: string, pcDrivers: PcDriver[]): PcDriverMatched[] => {
    const driverKey = `${platform}-${arch}`
    return pcDrivers
        .filter((driver) => driver[driverKey])
        .map((driver) => {
            return { name: driver.name, uri: driver[driverKey] }
        })
}

const CODINGPACK_HW_ID = 'codingpack'

export default function CodingpackView() {
    const [info, setInfo] = useState<IHwInfo>()
    const [loadingState, setLoadingState] = useState<'first' | 'loading' | 'loaded' | 'error'>('first')
    const [selected, setSelected] = useState(false)
    const loadInfo = useCallback(async () => {
        setLoadingState('loading')
        const info = await window.service.hw.findInfoById(CODINGPACK_HW_ID)
        setLoadingState(info ? 'loaded' : 'error')
        setInfo(info ?? undefined)
    }, [])

    useEffect(() => {
        loadInfo()
    }, [])

    useEffect(() => {
        if (!info) return
        if (selected) return
        window.service.hw.selectHw(info.hwId)
        setSelected(true)
    }, [info, selected])

    if (!info || !selected) {
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
type DialogId = 'CodingpackActionDialog'
function CodingpackInternalView(props: Props) {
    const { hwInfo: info } = props
    const context = usePromiseValue<IContext | undefined>(async () => await window.service.context.getAll(), undefined)
    const [portInfos, setPortInfos] = useState<PortInfo[]>([])
    const [portInfo, setPortInfo] = useState<PortInfo>()
    const [refreshToken, setRefreshToken] = useState(0)
    const [dialogId, setDialogId] = useState<DialogId>()
    const [codingpackActionDialogProps, setCodingpackActionDialogProps] = useState<CodingpackActionDialogProps>()
    const hwServerState = useHwServerState()
    const hwReady = !isNullish(portInfo) && hwServerState?.running === true

    const _closeDialog = () => {
        setDialogId(undefined)
        setCodingpackActionDialogProps(undefined)
    }

    const _openCodingpackActionDialog = (kind: CodingpackActionKindKey) => {
        if (!hwReady) {
            toast.warn('연결되지 않았습니다')
            return
        }
        setDialogId('CodingpackActionDialog')
        setCodingpackActionDialogProps({
            open: true,
            actionKind: kind,
            onClose: _closeDialog,
        })
    }

    const pcDrivers = useMemo<PcDriverMatched[]>(() => {
        if (!context) return []
        return filterPcDrivers(context.platform, context.osArch, info.pcDrivers)
    }, [context, info.pcDrivers])

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
        if (!portInfo) {
            // alert('포트인포 없어')
            // window.service.hw.stopServer()
            return
        }
        const hwId = info.hwId
        window.service.hw.selectSerialPort(hwId, portInfo.path)
    }, [info.hwId, portInfo])

    useUnmount(() => {
        window.service.hw.unselectHw(info.hwId)
    })

    useEffect(() => {
        loadPorts(info.hwId)
    }, [refreshToken, loadPorts, info.hwId])

    const _onClickPort = (port: PortInfo) => {
        setPortInfo(port)
    }

    useEffect(() => {
        if (codingpackActionDialogProps) return
        const hwId = info.hwId
        const s1 = interval(5000).subscribe(() => {
            loadPorts(hwId)
        })
        return () => {
            s1.unsubscribe()
        }
    }, [codingpackActionDialogProps, info.hwId, portInfo, loadPorts])

    const _onClickBack = () => {
        window.service.hw.unselectHw(info.hwId)
    }

    const _onClickFirmwareDownload = () => {
        const firmwareFile = info.firmwareFile
        if (!firmwareFile) return
        window.service.hw.downloadDriver(firmwareFile)
    }

    const _onClickDriver = (driverPath: string) => {
        window.service.hw.downloadDriver(driverPath)
    }

    const _onClickChrome = () => {
        // window.service.hw.downloadDriver(driverPath)
        window.service.native.openUrl('https://aicodiny.com/maker')
    }

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'flex-start',
                flexDirection: 'column',
                position: 'relative',
                pb: 10,
            }}
        >
            <Box
                sx={{ margin: '0 auto', border: '0px solid red', position: 'relative', width: '100%', maxWidth: 960 }}
                pt={10}
            >
                <Grid container sx={{ border: '0px solid red', flex: 0 }}>
                    <Grid item xs={4} sm={4} md={5} lg={5}>
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
                                <PulseLoader
                                    color={hwReady ? 'steelblue' : '#ccc'}
                                    loading={hwReady}
                                    size={hwReady ? 8 : 4}
                                    margin={5}
                                    speedMultiplier={0.25}
                                />
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={4} sm={4} md={2} lg={2}>
                        <PortsView
                            portInfos={portInfos}
                            portPath={portInfo?.path}
                            onClickPort={_onClickPort}
                            onClickRefresh={() => setRefreshToken(Date.now())}
                        />
                    </Grid>
                    <Grid item xs={4} sm={4} md={5} lg={5}>
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
                                <PulseLoader
                                    color={hwReady ? 'steelblue' : '#ccc'}
                                    loading={hwReady}
                                    size={hwReady ? 8 : 4}
                                    margin={5}
                                    speedMultiplier={0.25}
                                />
                            </Box>
                        </Box>
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
                            {pcDrivers.map((driver, idx) => (
                                <Button
                                    key={driver.uri}
                                    variant="contained"
                                    sx={{ width: 180, height: 40 }}
                                    onClick={() => _onClickDriver(driver.uri)}
                                >
                                    {driver.name}
                                </Button>
                            ))}
                        </Box>
                    </Grid>
                    <Grid item xs={4} sm={4} md={2} lg={2}>
                        {/* dummy */}
                    </Grid>
                    <Grid item xs={4} sm={4} md={5} lg={5}>
                        <Box
                            sx={{
                                mt: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                fontSize: '0.8rem',
                                lineHeight: '1.2rem',
                            }}
                        >
                            <Box
                                sx={{
                                    textAlign: 'left',
                                    color: 'steelblue',
                                    ml: -4,
                                }}
                            >
                                ★ 연결이 안될때 체크하기
                            </Box>
                            <Box
                                sx={{
                                    textAlign: 'left',
                                    color: '#777',
                                }}
                            >
                                - 전원과 USB 케이블을 모두 연결하셨나요?
                                <br />- 노랑 버튼을 4초간 길게 누르셨나요? (콘솔모드)
                            </Box>
                        </Box>
                    </Grid>
                </Grid>

                <Container maxWidth="sm" disableGutters sx={{ mt: 10 }}>
                    {!hwReady && (
                        <Alert
                            severity="warning"
                            sx={{
                                display: 'flex',
                                mt: 1,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                            icon={false}
                        >
                            <ul>
                                {portInfos.length === 0 && <li>장치를 연결해주세요.</li>}

                                <li>장치를 연결했는데 연결포트가 보이지 않는 경우 드라이버를 설치해주세요.</li>
                            </ul>
                        </Alert>
                    )}
                </Container>

                {hwReady && (
                    <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%' }}>
                        <Alert
                            severity="info"
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: '#EBF2F8',
                                margin: '0 auto',
                            }}
                            icon={false}
                        >
                            PC에 케이블이 연결되었습니다.
                        </Alert>
                    </Box>
                )}

                <Box mt={2}>
                    <Container maxWidth="sm" disableGutters>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Button
                                endIcon={<ChevronRightIcon />}
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    CustomEvents.doc.openDialog.send({ docId: 'hw-pc-how-to-codingpack-setup' })
                                }}
                            >
                                설명서
                            </Button>
                            <Button
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    CustomEvents.doc.openDialog.send({ docId: 'hw-pc-codingpack-setup-help' })
                                }}
                            >
                                문제가 생겼나요?
                            </Button>
                        </Box>
                        <Stack spacing={2}>
                            {CodingpackActions.filter((it) => !DISABLED_KIND.includes(it.kind)).map(
                                ({ title, subtitle, docId, kind }) => (
                                    <CodingpackActionRow
                                        key={kind}
                                        onClick={() => _openCodingpackActionDialog(kind)}
                                        disabled={!hwReady}
                                        docId={docId}
                                        kind={kind}
                                        title={title}
                                        subtitle={subtitle}
                                    />
                                ),
                            )}
                        </Stack>
                    </Container>
                </Box>
            </Box>
            {dialogId === 'CodingpackActionDialog' && codingpackActionDialogProps && (
                <CodingpackActionDialog {...codingpackActionDialogProps} />
            )}
        </Box>
    )
}
