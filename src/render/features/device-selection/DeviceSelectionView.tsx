import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Alert, Button, Grid, IconButton, Toolbar, Tooltip, Typography } from '@mui/material'
import { Box } from '@mui/system'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { PulseLoader } from 'react-spinners'
import { useUnmount } from 'react-use'
import { from, interval, mergeMapTo } from 'rxjs'
import { PortInfo } from 'serialport'
import { IHwInfo, PcDriver } from 'src/custom-types/hw-types'
import Image from 'src/render/components/Image'
import { usePromiseValue } from 'src/render/util/useServiceValue'
import { IContext } from 'src/services/context/interface'
import { useHwServerState } from 'src/services/hw/hook'
import PortsView from './components/ports/PortsView'

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

export default function DeviceSelectionView(props: Props) {
    const { hwInfo: info } = props
    const context = usePromiseValue<IContext | undefined>(async () => await window.service.context.getAll(), undefined)
    const [portInfos, setPortInfos] = useState<PortInfo[]>([])
    const [portInfo, setPortInfo] = useState<PortInfo>()
    const [readablePath, setReadablePath] = useState<string>()
    const [refreshToken, setRefreshToken] = useState(0)

    const pcDrivers = useMemo<PcDriverMatched[]>(() => {
        if (!context) return []
        return filterPcDrivers(context.platform, context.osArch, info.pcDrivers)
    }, [context, info.pcDrivers])

    const hwServerState = useHwServerState()
    const checkReadable = useCallback(async (hwId: string, portPath: string) => {
        console.log('checkReadable:' + hwId + ',' + portPath)
        let readable = false
        try {
            readable = await window.service.hw.isReadable(hwId, portPath)
        } catch (ignore) {}
        if (readable) {
            setReadablePath(portPath)
        } else {
            setReadablePath(undefined)
        }
    }, [])

    const loadPorts = useCallback(async (hwId: string) => {
        const ports = await window.service.hw.serialPortList(hwId)
        setPortInfos(ports ?? [])
    }, [])

    useEffect(() => {
        if (portInfos.length > 0) {
            const exists = portInfo && portInfos.find((it) => it.path === portInfo.path)
            if (!exists) {
                setPortInfo(portInfos[0])
            }
        } else {
            if (portInfo) {
                setPortInfo(undefined)
            }
        }
    }, [portInfo, portInfos])

    useEffect(() => {
        if (!portInfo) return
        const hwId = info.hwId
        const s1 = interval(5000)
            .pipe(mergeMapTo(from(checkReadable(hwId, portInfo.path))))
            .subscribe()
        return () => {
            s1.unsubscribe()
        }
    }, [info.hwId, portInfo, checkReadable])

    useEffect(() => {
        if (!portInfo) {
            window.service.hw.stopServer()
            return
        }
        const hwId = info.hwId
        window.service.hw.start(hwId, portInfo.path)
    }, [info.hwId, portInfo])

    useUnmount(() => {
        window.service.hw.stop()
    })

    useEffect(() => {
        loadPorts(info.hwId)
    }, [refreshToken, loadPorts, info.hwId])

    const _onClickPort = (port: PortInfo) => {
        setPortInfo(port)
    }

    const _onClickBack = () => {
        window.service.hw.stop()
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
        window.service.native.openUrl('https://aicodingblock.kt.co.kr/maker')
    }

    const readable = Boolean(readablePath && readablePath === portInfo?.path)

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'flex-start',
                flexDirection: 'column',
            }}
        >
            <Toolbar
                variant="dense"
                sx={{
                    background:
                        'linear-gradient(90deg, rgba(0,92,162,1) 0%, rgba(0,51,115,1) 50%, rgba(80,137,212,1) 100%)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton
                        onClick={_onClickBack}
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        sx={{
                            marginRight: '24px',
                        }}
                    >
                        <ArrowBackIcon htmlColor="#fff" />
                    </IconButton>
                    <Typography variant="subtitle1" sx={{ color: '#FFF' }}>
                        {info.hwName}
                    </Typography>
                </Box>
                <Tooltip title="브라우저 열기">
                    <IconButton
                        onClick={_onClickChrome}
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        sx={{
                            marginRight: '24px',
                        }}
                    >
                        <Image sx={{ width: 24, height: 24 }} src="static/images/ic_chrome.png" />
                    </IconButton>
                </Tooltip>
            </Toolbar>

            <Box sx={{ margin: '0 auto', width: '100%', maxWidth: 960 }} pt={10}>
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
                                    color="steelblue"
                                    loading={hwServerState?.running === true}
                                    size={8}
                                    margin={5}
                                    speedMultiplier={0.35}
                                />
                            </Box>
                        </Box>
                    </Grid>
                    <Grid item xs={4} sm={4} md={2} lg={2}>
                        <PortsView
                            portInfos={portInfos}
                            portPath={portInfo?.path}
                            readable={readable}
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
                                    color="steelblue"
                                    loading={hwServerState?.running === true}
                                    size={8}
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
                                    onClick={() => _onClickFirmwareDownload()}
                                >
                                    펌웨어 설치
                                </Button>
                            )}
                        </Box>
                    </Grid>
                </Grid>
                <Box mt={10}>
                    {hwServerState?.running === true ? (
                        <Alert
                            severity="info"
                            sx={{
                                display: 'flex',
                                mt: 1,
                                width: 300,
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: '#EBF2F8',
                                margin: '0 auto',
                            }}
                            icon={false}
                        >
                            서버 실행중...
                        </Alert>
                    ) : (
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
                </Box>
                {/*
                <Box>
                    <Typography variant="h6">장치 정보</Typography>
                    <TableContainer>
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell>모델</TableCell>
                                    <TableCell>{info.hwName}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>모델 유형</TableCell>
                                    <TableCell>{info.hwKind}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>분류</TableCell>
                                    <TableCell>{info.category}</TableCell>
                                </TableRow>

                                {info.homepage && (
                                    <TableRow>
                                        <TableCell>홈페이지</TableCell>
                                        <TableCell>
                                            <Typography
                                                variant="body2"
                                                sx={{ color: 'theme.primary', cursor: 'pointer' }}
                                                onClick={() => window.service.native.openUrl(info.homepage ?? '')}
                                            >
                                                info.homepage
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {info.email && (
                                    <TableRow>
                                        <TableCell>이메일</TableCell>
                                        <TableCell>{info.email}</TableCell>
                                    </TableRow>
                                )}

                                {info.guideVideo && (
                                    <TableRow>
                                        <TableCell colSpan={2}>{info.guideVideo}</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box> */}
            </Box>
        </Box>
    )
}
