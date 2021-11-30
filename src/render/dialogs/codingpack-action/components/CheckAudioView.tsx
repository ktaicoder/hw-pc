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
                    <Tooltip title="실행 취소">
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
                    다음의 순서로 테스트가 실행됩니다.
                </Typography>

                <Box sx={{ fontSize: '0.85rem', mt: 1 }}>
                    <ol>
                        <li>
                            스피커 테스트
                            <ul>
                                <li>실행을 시작하면 스피커에서 소리를 냅니다. </li>
                                <li>소리가 들리는지 확인해보세요.</li>
                                <li>소리가 들리지 않으면 스피커에 문제가 있을 수 있습니다. 가이드를 확인해주세요</li>
                            </ul>
                        </li>
                        <li>
                            마이크 테스트
                            <ul>
                                <li>
                                    스피커 테스트가 끝나면 바로, 5초간 녹음이 자동 시작됩니다. 이때, 아무 말이나
                                    해보세요
                                </li>
                                <li>녹음된 소리를 재생합니다.</li>
                                <li>
                                    녹음된 소리가 들리지 않으면 마이크에 문제가 있을 수 있습니다. 가이드를 확인해주세요
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
                    실행하기
                </Button>

                {errorMessage && <Typography>{errorMessage}</Typography>}
            </Box>
        )
    }
}
