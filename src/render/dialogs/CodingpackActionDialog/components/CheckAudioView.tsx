import KeyboardDoubleArrowRightRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowRightRounded'
import KeyboardDoubleArrowLeftRoundedIcon from '@mui/icons-material/KeyboardDoubleArrowLeftRounded'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import { Box, Button, CircularProgress, IconButton, Tooltip, Typography } from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useUnmount } from 'react-use'
import { firstValueFrom } from 'rxjs'
import { CodingpackActionKindKey } from 'src/domain/codingpack'
import { CodingpackActions } from 'src/render/features/codingpack/codingpack-actions'
import { HwClient } from '../socket/HwClient'

type RunningCallbackFn = (running: boolean) => void

type Props = {
    hwClient: HwClient
    onRunning: RunningCallbackFn
    minimized: boolean
    toggleMinimize: () => void
}

const ACTION_KIND: CodingpackActionKindKey = 'audio'

export default function CheckAudioView(props: Props) {
    const { hwClient, minimized, toggleMinimize } = props
    const [cmdRunning, setCmdRunning] = useState(false)
    const [cmdCanceling, setCmdCanceling] = useState(false)
    const onRunningRef = useRef<RunningCallbackFn>()
    const [errorMessage, setErrorMessage] = useState<string>()
    const runContextRef = useRef({ canceled: false })
    const actionData = useMemo(() => CodingpackActions.find((it) => it.kind === ACTION_KIND)!, [])

    onRunningRef.current = props.onRunning
    useEffect(() => {
        onRunningRef.current?.(cmdRunning)
    }, [cmdRunning])

    const doStart = useCallback(async () => {
        setCmdRunning(true)
        setErrorMessage(undefined)
        try {
            await firstValueFrom(hwClient.runAudioTest())
        } catch (err) {
            setErrorMessage(err.message)
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
                    position: 'relative',
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
                <Typography variant="body1" sx={{ mt: 1, textAlign: 'center', fontSize: '0.8rem' }}>
                    ????????? ????????? ???????????? ???????????????.
                </Typography>

                <Box sx={{ fontSize: '0.85rem', mt: 1 }}>
                    <ol>
                        <li>
                            ????????? ?????????
                            <ul>
                                <li>????????? ???????????? ??????????????? ????????? ?????????. </li>
                                <li>????????? ???????????? ??????????????????.</li>
                                <li>????????? ????????? ????????? ???????????? ????????? ?????? ??? ????????????. ???????????? ??????????????????</li>
                            </ul>
                        </li>
                        <li>
                            ????????? ?????????
                            <ul>
                                <li>
                                    ????????? ???????????? ????????? ??????, 5?????? ????????? ?????? ???????????????. ??????, ?????? ?????????
                                    ????????????
                                </li>
                                <li>????????? ????????? ???????????????.</li>
                                <li>
                                    ????????? ????????? ????????? ????????? ???????????? ????????? ?????? ??? ????????????. ???????????? ??????????????????
                                </li>
                            </ul>
                        </li>
                    </ol>
                </Box>

                <Button
                    sx={{ mt: 4 }}
                    variant="outlined"
                    onClick={() => doStart()}
                    color={cmdRunning ? 'secondary' : 'primary'}
                >
                    ????????????
                </Button>

                {errorMessage && <Typography>{errorMessage}</Typography>}
            </Box>
        )
    }
}
