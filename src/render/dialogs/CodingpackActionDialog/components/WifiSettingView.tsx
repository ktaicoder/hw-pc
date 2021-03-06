import { RefreshOutlined } from '@mui/icons-material'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import KeyboardDoubleArrowLeftRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowLeftRounded'
import KeyboardDoubleArrowRightRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowRightRounded'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import {
    Box,
    Button,
    CircularProgress,
    IconButton,
    InputAdornment,
    OutlinedInput,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { useUnmount } from 'react-use'
import { firstValueFrom } from 'rxjs'
import { CodingpackActionKindKey } from 'src/domain/codingpack'
import { CodingpackActions } from 'src/render/features/codingpack/codingpack-actions'
import { sleepAsync } from 'src/render/util/sleepAsync'
import { useTimeoutText } from 'src/render/util/useTimeoutText'
import { HwClient, WifiAp } from '../socket/HwClient'
import WifiApList from './WifiApList'

type RunningCallbackFn = (running: boolean) => void

type Props = {
    hwClient: HwClient
    onRunning: RunningCallbackFn
    minimized: boolean
    toggleMinimize: () => void
}

const ACTION_KIND: CodingpackActionKindKey = 'wifi'

export default function WifiSettingView(props: Props) {
    const { hwClient, minimized, toggleMinimize } = props
    const [cmdRunning, setCmdRunning] = useState(false)
    const [cmdCanceling, setCmdCanceling] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const onRunningRef = useRef<RunningCallbackFn>()
    const [errorMessage, setErrorMessage] = useState<string>()
    const runContextRef = useRef({ canceled: false })
    const actionData = useMemo(() => CodingpackActions.find((it) => it.kind === ACTION_KIND)!, [])
    const [ssid, setSsid] = useState<string>()
    const [password, setPassword] = useState<string>()
    const [resultMessage, setResultMessage] = useTimeoutText(2500)
    const [wifiApList, setWifiApList] = useState<WifiAp[]>([])
    const [scanning, setScanning] = useState(false)

    onRunningRef.current = props.onRunning
    useEffect(() => {
        onRunningRef.current?.(cmdRunning)
    }, [cmdRunning])

    const doLoadWifiList = useCallback(async () => {
        setScanning(true)
        try {
            const apList = await firstValueFrom(hwClient.runWifiList())
            console.log(apList)
            setWifiApList(apList)
        } catch (err) {
            toast.warn('????????? ??????????????????:' + err.message)
        } finally {
            setScanning(false)
        }
    }, [hwClient])

    useEffect(() => {
        doLoadWifiList()
    }, [doLoadWifiList])

    const doStart = useCallback(
        async (ssid: string, pw: string) => {
            setCmdRunning(true)
            setErrorMessage(undefined)
            const startTime = Date.now()
            try {
                await firstValueFrom(hwClient.runWifiSsidChange(ssid, pw))
                const diff = Date.now() - startTime
                if (diff < 2500) {
                    await sleepAsync(1500)
                }
                setResultMessage('?????????????????????')
                toast.success('?????????????????????')
                setPassword('')
            } catch (err) {
                const diff = Date.now() - startTime
                if (diff < 2500) {
                    await sleepAsync(1500)
                }
                setErrorMessage(err.message)
                setResultMessage('????????????')
                toast.warn('??????????????????')
            } finally {
                setCmdRunning(false)
            }
        },
        [hwClient],
    )

    const doCancel = useCallback(async () => {
        setCmdCanceling(true)
        setErrorMessage(undefined)
        try {
            await firstValueFrom(hwClient.cancelTerminalInput())
        } catch (err) {
        } finally {
            setCmdCanceling(false)
            setCmdRunning(false)
        }
    }, [hwClient])

    useUnmount(() => {
        runContextRef.current.canceled = true
    })

    const validateAndSave = () => {
        const pw = password?.trim() ?? ''
        if (!pw) {
            toast.warn('??????????????? ??????????????????')
            return
        }

        if (pw.length < 8) {
            toast.warn('??????????????? 8?????????????????? ??????????????????')
            return
        }

        // ??? ????????? ???????????? ?????? ???????????? ????????? ????????? ??? ??????
        if (pw.includes(`'`) && pw.includes(`"`)) {
            toast.warn('??????????????? ???????????? ????????? ??? ????????????')
            return
        }

        // ??? ????????? ???????????? ?????? ???????????? ????????? ????????? ??? ??????
        const wifiSsid = ssid?.trim() ?? ''
        if (wifiSsid.includes(`'`) && wifiSsid.includes(`"`)) {
            toast.warn('SSID??? ???????????? ????????? ??? ????????????')
            return
        }

        if (wifiSsid.length < 1) {
            toast.warn('SSID??? ??????????????????')
            return
        }
        doStart(wifiSsid, pw)
    }

    if (cmdRunning) {
        return (
            <Box
                sx={{
                    py: 1,
                    px: 2,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    '& em': {
                        fontStyle: 'normal',
                        color: 'secondary',
                    },
                }}
            >
                {!cmdCanceling && (
                    <Tooltip title="?????? ??????">
                        <IconButton onClick={() => doCancel()} color="error">
                            <HighlightOffIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                )}
                {cmdCanceling && <CircularProgress color="warning" size="1rem" />}

                <Typography variant="subtitle1" sx={{ ml: 1, fontSize: '1.0rem', fontWeight: 700 }}>
                    {actionData.title}
                </Typography>
            </Box>
        )
    } else {
        return (
            <>
                <Box
                    sx={{
                        px: 3,
                        pt: 0,
                        pb: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        '& em': {
                            fontStyle: 'normal',
                            color: 'secondary',
                        },
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            p: 1.5,
                            justifyContent: 'space-between',
                        }}
                    >
                        <Typography variant="subtitle1" sx={{ ml: 1, fontSize: '1.2rem', fontWeight: 700 }}>
                            {actionData.title}
                        </Typography>
                    </Box>

                    <IconButton
                        onClick={() => toggleMinimize()}
                        sx={{
                            position: 'absolute',
                            top: 0,
                            ...(minimized && {
                                left: 0,
                            }),
                            ...(!minimized && {
                                right: 0,
                            }),
                        }}
                    >
                        {minimized ? (
                            <KeyboardDoubleArrowLeftRoundedIcon color="error" />
                        ) : (
                            <KeyboardDoubleArrowRightRoundedIcon />
                        )}
                    </IconButton>
                    <Box sx={{ fontSize: '0.85rem', mt: 1, textAlign: 'center', color: 'primary.main' }}>
                        {actionData.subtitle}
                    </Box>
                    <Typography variant="body1" sx={{ mt: 2, textAlign: 'center', fontSize: '0.8rem' }}>
                        WIFI SSID??? ??????????????? ??????????????????
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                    <Box
                        sx={{
                            flex: 1,
                            p: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Box sx={{ fontSize: '0.85rem', mt: 0 }}>
                            <TextField
                                fullWidth
                                placeholder="SSID"
                                size="small"
                                sx={{ minWidth: '200px' }}
                                type="text"
                                onChange={(e) => setSsid(e.target.value)}
                                value={ssid ?? ''}
                            />
                        </Box>
                        <Box sx={{ fontSize: '0.85rem', mt: 2 }}>
                            <OutlinedInput
                                fullWidth
                                placeholder="PASSWORD"
                                size="small"
                                sx={{ minWidth: '200px' }}
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={(e) => setShowPassword((p) => !p)}
                                            onMouseDown={(e) => e.preventDefault()}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                }
                                onChange={(e) => setPassword(e.target.value)}
                                value={password ?? ''}
                            />
                        </Box>

                        {resultMessage && (
                            <Box>
                                <Typography sx={{ fontSize: '0.85rem', color: 'error.main' }}>
                                    {resultMessage}
                                </Typography>
                            </Box>
                        )}

                        <Button
                            variant="outlined"
                            sx={{ mt: 4 }}
                            disabled={scanning}
                            onClick={() => validateAndSave()}
                            color={cmdRunning ? 'secondary' : 'primary'}
                        >
                            ??????
                        </Button>
                    </Box>

                    <Box
                        sx={{
                            flexBasis: '340px',
                            position: 'relative',
                            overflowX: 'hidden',
                            maxWidth: '340px',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                        }}
                    >
                        <Box
                            sx={{
                                display: 'flex',
                                width: '100%',
                                overflowY: 'scroll',
                                maxHeight: '360px',
                                minHeight: '360px',
                                pt: '40px',
                            }}
                        >
                            <WifiApList wifiApList={wifiApList} onClick={(ap) => setSsid(ap.ssid)} />
                        </Box>
                        <Box
                            sx={{
                                position: 'absolute',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                width: '100%',
                                height: '40px',
                                background: '#fff',
                                top: 0,
                                left: 0,
                            }}
                        >
                            <Typography variant="body2">SSID ??????</Typography>
                            {scanning && <CircularProgress size="0.8rem" sx={{ ml: 1 }} color="primary" />}
                            {!scanning && (
                                <IconButton sx={{ ml: 1 }} onClick={() => doLoadWifiList()} disabled={cmdRunning}>
                                    <RefreshOutlined fontSize="small" />
                                </IconButton>
                            )}
                        </Box>
                    </Box>
                </Box>
            </>
        )
    }
}
