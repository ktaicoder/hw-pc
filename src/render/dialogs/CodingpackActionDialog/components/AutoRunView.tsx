import { DeleteOutline } from '@mui/icons-material'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import KeyboardDoubleArrowLeftRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowLeftRounded'
import KeyboardDoubleArrowRightRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowRightRounded'
import { Box, Button, CircularProgress, IconButton, OutlinedInput, Tooltip, Typography } from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { useUnmount } from 'react-use'
import { firstValueFrom } from 'rxjs'
import { CodingpackActionKindKey } from 'src/domain/codingpack'
import { CodingpackActions } from 'src/render/features/codingpack/codingpack-actions'
import { sleepAsync } from 'src/render/util/sleepAsync'
import { useTimeoutText } from 'src/render/util/useTimeoutText'
import { HwClient } from '../socket/HwClient'

type RunningCallbackFn = (running: boolean) => void

const AUTORUN_URL_PREFIX = ['https://aicodiny.com/', 'https://aimk.jjfive.net/']

function isValidUrl(url: string): boolean {
    try {
        new URL(url)
    } catch (e) {
        console.error(e)
        return false
    }
    return true
}

type Props = {
    hwClient: HwClient
    onRunning: RunningCallbackFn
    minimized: boolean
    toggleMinimize: () => void
}

const ACTION_KIND: CodingpackActionKindKey = 'autorun'

export default function AutoRunView(props: Props) {
    const { hwClient, minimized, toggleMinimize } = props
    const [cmdRunning, setCmdRunning] = useState(false)
    const [cmdCanceling, setCmdCanceling] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const onRunningRef = useRef<RunningCallbackFn>()
    const [errorMessage, setErrorMessage] = useState<string>()
    const runContextRef = useRef({ canceled: false })
    const actionData = useMemo(() => CodingpackActions.find((it) => it.kind === ACTION_KIND)!, [])
    const [autoRunUrl, setAutoRunUrl] = useState<string>()
    const [resultMessage, setResultMessage] = useTimeoutText(2500)

    onRunningRef.current = props.onRunning
    useEffect(() => {
        onRunningRef.current?.(cmdRunning)
    }, [cmdRunning])

    const doAutoRunCreate = useCallback(
        async (url: string) => {
            setCmdRunning(true)
            setErrorMessage(undefined)
            const startTime = Date.now()
            try {
                await firstValueFrom(hwClient.runAutoRunCreate(url))
                const diff = Date.now() - startTime
                if (diff < 2500) {
                    await sleepAsync(700)
                }
                setResultMessage('?????????????????????')
                toast.success('?????????????????????')
                setAutoRunUrl('')
            } catch (err) {
                const diff = Date.now() - startTime
                if (diff < 2500) {
                    await sleepAsync(700)
                }
                setErrorMessage(err.message)
                setResultMessage('?????? ??????')
                toast.warn('????????? ??????????????????')
            } finally {
                setCmdRunning(false)
            }
        },
        [hwClient],
    )

    const doAutoRunRemove = useCallback(async () => {
        setCmdRunning(true)
        setErrorMessage(undefined)
        const startTime = Date.now()
        try {
            await firstValueFrom(hwClient.runAutoRunRemove())
            const diff = Date.now() - startTime
            if (diff < 2500) {
                await sleepAsync(700)
            }
            setResultMessage('?????????????????????')
            toast.success('?????????????????????')
            setAutoRunUrl('')
        } catch (err) {
            const diff = Date.now() - startTime
            if (diff < 2500) {
                await sleepAsync(700)
            }
            setErrorMessage(err.message)
            setResultMessage('?????? ??????')
            toast.warn('?????? ??????')
        } finally {
            setCmdRunning(false)
        }
    }, [hwClient])

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
        const url = autoRunUrl?.trim() ?? ''
        if (url.length === 0) {
            toast.warn('????????? ??????????????????')
            return
        }
        if (!isValidUrl(url)) {
            toast.warn('???????????? ?????? ???????????????')
            return
        }

        if (!AUTORUN_URL_PREFIX.some((prefix) => url.startsWith(prefix))) {
            toast.warn('Codiny ???????????? ????????? ??????????????????')
            return
        }

        doAutoRunCreate(url)
    }
    const autoRunRemove = () => {
        if (!confirm('????????? ????????? ?????????????????????????')) return

        doAutoRunRemove()
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
                    ????????? ????????? ??????????????????.
                </Typography>

                <Box sx={{ fontSize: '0.85rem', mt: 1, minWidth: '400px' }}>
                    <OutlinedInput
                        fullWidth
                        autoFocus
                        size="small"
                        type="text"
                        onChange={(e) => setAutoRunUrl(e.target.value)}
                        value={autoRunUrl ?? ''}
                    />
                </Box>

                {resultMessage && (
                    <Box>
                        <Typography sx={{ fontSize: '0.85rem', color: 'error.main' }}>{resultMessage}</Typography>
                    </Box>
                )}

                <Box sx={{ mt: 2, display: 'flex', width: '100%', alignItems: 'center', maxWidth: '400px' }}>
                    <Button
                        variant="outlined"
                        sx={{ flex: 0, margin: 'auto' }}
                        onClick={() => validateAndSave()}
                        color={cmdRunning ? 'secondary' : 'primary'}
                    >
                        ??????
                    </Button>
                    <IconButton onClick={() => autoRunRemove()} color={cmdRunning ? 'secondary' : 'primary'}>
                        <DeleteOutline />
                    </IconButton>
                </Box>

                {errorMessage && <Typography>{errorMessage}</Typography>}
            </Box>
        )
    }
}
