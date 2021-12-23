import CloseIcon from '@mui/icons-material/Close'
import {
    Box,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    LinearProgress,
    Typography,
} from '@mui/material'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useMeasure } from 'react-use'
import { BehaviorSubject, bufferTime, debounceTime, filter, firstValueFrom, take, takeUntil, timeout } from 'rxjs'
import { CodingpackActionKind, CodingpackActionKindKey } from 'src/domain/codingpack'
import ReactConsole, { ReactConsoleControl } from 'src/render/components/react-console/ReactConsole'
import { fixWebPath } from 'src/render/util/fixWebPath'
import AutoRunView from './components/AutoRunView'
import BluetoothSettingView from './components/BluetoothSettingView'
import CheckAudioView from './components/CheckAudioView'
import CodingpackInspectView from './components/CodingpackInspectView'
import RebootView from './components/RebootView'
import RescueView from './components/RescueView'
import SystemResetView from './components/SystemResetView'
import UpdateView from './components/UpdateView'
import UserPwView from './components/UserPwView'
import WifiSettingView from './components/WifiSettingView'
import { HwClient } from './socket/HwClient'

export type CodingpackActionDialogProps = {
    actionKind: CodingpackActionKindKey
    open: boolean
    onClose: () => void
}

const INITIAL_SETUP_TIMEOUT_SEC = 5

export default function CodingpackActionDialog(props: CodingpackActionDialogProps) {
    const { actionKind, open, onClose } = props
    const [containerRef, { height: containerHeight }] = useMeasure()
    const [expand, setExpand] = useState(true)
    const [loading, setLoading] = useState(true)
    const [cmdRunning, setCmdRunning] = useState(false)
    const [minimized, setMinimized] = useState(false)
    const [initialReady, setInitialReady] = useState(false)
    const title = CodingpackActionKind[actionKind]
    const hwClient = useMemo(() => new HwClient('codingpack', 'ws://127.0.0.1:3001'), [])

    const [terminal, setTerminal] = useState<ReactConsoleControl | null>(null)

    const [promptReady, setPromptReady] = useState<boolean>(false)

    const doConnect = useCallback(
        async (cancelTrigger$: BehaviorSubject<number>) => {
            setLoading(true)
            // 연결하기
            hwClient.connect()

            try {
                // console.log('웹소켓 연결을 기다리기')
                await hwClient.waitForConnected()
                if (cancelTrigger$.value > 0) return
                // console.log('웹소켓 연결이 되었습니다. 이제 터미널을 엽니다')

                await hwClient.sendOpenTerminalRequest()
                if (cancelTrigger$.value > 0) return
                // console.log('터미널이 열렸습니다')

                // 시작할때 컨트롤 d를 두번 누르고 시작한다.
                /// hwClient.sendBinary(new Uint8Array(ControlKeys.d))
                /// hwClient.sendBinary(new Uint8Array(ControlKeys.d))
                hwClient.sendText('\n')
                hwClient.sendText('\n')
                await firstValueFrom(
                    hwClient.observeTerminalPrompt().pipe(
                        debounceTime(500),
                        filter((it) => it === true),
                        take(1),
                        takeUntil(cancelTrigger$.pipe(filter((it) => it > 0))),
                        timeout(INITIAL_SETUP_TIMEOUT_SEC * 1000), // 타임아웃
                    ),
                )
                setInitialReady(true)
            } catch (err) {
                console.log(err)
                setInitialReady(false)
            } finally {
                setLoading(false)
            }
        },
        [hwClient],
    )

    useEffect(() => {
        if (!terminal) return
        const s1 = hwClient
            .observeTerminalPrompt()
            .pipe(debounceTime(300))
            .subscribe((isPromptReceived) => {
                setPromptReady(isPromptReceived)
                if (isPromptReceived) {
                    setInitialReady(true)
                }
            })
        return () => {
            s1.unsubscribe()
        }
    }, [hwClient, terminal])

    // 터미널의 메시지를 ReactConsole에 표시하도록 모으기
    useEffect(() => {
        if (!terminal) return
        const s1 = hwClient
            .observeTerminalMessage()
            .pipe(
                bufferTime(200),
                filter((lines) => lines.length > 0),
            )
            .subscribe((msgLines) => {
                if (msgLines.length > 0) {
                    terminal.print(msgLines)
                }
            })
        return () => {
            s1.unsubscribe()
        }
    }, [hwClient, terminal])

    useEffect(() => {
        const cancelTrigger$ = new BehaviorSubject<number>(0)
        doConnect(cancelTrigger$)
        return () => {
            cancelTrigger$.next(Date.now())
            hwClient.disconnect()
        }
    }, [hwClient])

    const _onRunning = useCallback((running: boolean) => {
        setCmdRunning(running)
    }, [])

    const terminalLineCount = terminal?.getLineCount() ?? 0
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={expand ? 'md' : 'sm'}
            fullWidth
            sx={{
                '& .MuiPaper-root': {
                    background: '#FFF',
                },
                '& .MuiDialog-paperScrollPaper': {
                    minHeight: 'calc(100vh - 70px)',
                },
                '& .MuiDialogContent-root': {
                    p: 0,
                    m: 0,
                },
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {/* <IconButton size="small" onClick={() => setExpand(!expand)}>
                        <AspectRatioIcon />
                    </IconButton> */}

                    <Box
                        sx={{
                            ml: 2,
                            fontSize: '0.85rem',
                            color: '#888',
                            display: 'flex',
                            alignItems: 'center',
                            textDecoration: 'none',
                            ':hover': {
                                color: '#000',
                            },
                        }}
                    >
                        {title}
                    </Box>
                </Box>
                <IconButton size="small" onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers ref={containerRef}>
                <Box
                    component="div"
                    sx={{
                        p: 0,
                        position: 'relative',
                        width: '100%',
                        height: `calc( ${containerHeight.toFixed(0)}px - 10px)`,
                        border: 'none',
                        overflowX: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <ReactConsole
                        consoleRef={setTerminal}
                        onSubmitText={hwClient.sendTextLine}
                        onSubmitBinary={hwClient.sendBinary}
                        readonly={!cmdRunning && minimized && promptReady ? false : true}
                        sx={{
                            flex: 1,
                            position: 'relative',
                            display: 'block',
                            width: '100%',
                            minHeight: '100px',
                            opacity: cmdRunning || minimized ? 1 : 0.8,
                            border: '1px solid #ccc',
                            overflowY: 'scroll',
                            background: `url(${fixWebPath('static/images/bg_terminal2.png')})`,
                            backgroundSize: 'cover',
                            backgroundPosition: '50% 50%',
                            backgroundRepeat: 'no-repeat',
                        }}
                    />
                    {initialReady && (
                        <Box
                            sx={{
                                position: 'absolute',
                                ...(!cmdRunning && {
                                    ...(minimized && {
                                        top: '50%',
                                        right: '60px',
                                        transform: 'translate(100%, -50%)',
                                        // left: 'calc(100% - 60px)',
                                    }),
                                    ...(!minimized && {
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                    }),

                                    borderRadius: '8px',
                                    width: '50vw',
                                    minWidth: '400px',
                                    maxWidth: '500px',
                                }),
                                ...(cmdRunning && {
                                    top: 0,
                                    right: 0,
                                    minWidth: '200px',
                                    borderRadius: '0px',
                                }),

                                transition: '0.2s',
                                background: cmdRunning ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,1)',
                            }}
                        >
                            {actionKind === 'inspect' && (
                                <CodingpackInspectView
                                    minimized={minimized}
                                    toggleMinimize={() => setMinimized((p) => !p)}
                                    onRunning={_onRunning}
                                    hwClient={hwClient}
                                />
                            )}
                            {actionKind === 'audio' && (
                                <CheckAudioView
                                    minimized={minimized}
                                    toggleMinimize={() => setMinimized((p) => !p)}
                                    onRunning={_onRunning}
                                    hwClient={hwClient}
                                />
                            )}
                            {actionKind === 'autorun' && (
                                <AutoRunView
                                    minimized={minimized}
                                    toggleMinimize={() => setMinimized((p) => !p)}
                                    onRunning={_onRunning}
                                    hwClient={hwClient}
                                />
                            )}
                            {actionKind === 'pw' && (
                                <UserPwView
                                    minimized={minimized}
                                    toggleMinimize={() => setMinimized((p) => !p)}
                                    onRunning={_onRunning}
                                    hwClient={hwClient}
                                />
                            )}
                            {actionKind === 'reboot' && (
                                <RebootView
                                    minimized={minimized}
                                    toggleMinimize={() => setMinimized((p) => !p)}
                                    onRunning={_onRunning}
                                    hwClient={hwClient}
                                />
                            )}
                            {actionKind === 'update' && (
                                <UpdateView
                                    minimized={minimized}
                                    toggleMinimize={() => setMinimized((p) => !p)}
                                    onRunning={_onRunning}
                                    hwClient={hwClient}
                                />
                            )}
                            {actionKind === 'wifi' && (
                                <WifiSettingView
                                    minimized={minimized}
                                    toggleMinimize={() => setMinimized((p) => !p)}
                                    onRunning={_onRunning}
                                    hwClient={hwClient}
                                />
                            )}
                            {actionKind === 'bluetooth' && (
                                <BluetoothSettingView
                                    minimized={minimized}
                                    toggleMinimize={() => setMinimized((p) => !p)}
                                    onRunning={_onRunning}
                                    hwClient={hwClient}
                                />
                            )}
                            {actionKind === 'upgrade' && (
                                <SystemResetView
                                    minimized={minimized}
                                    toggleMinimize={() => setMinimized((p) => !p)}
                                    onRunning={_onRunning}
                                    hwClient={hwClient}
                                />
                            )}
                            {actionKind === 'rescue' && (
                                <RescueView
                                    minimized={minimized}
                                    toggleMinimize={() => setMinimized((p) => !p)}
                                    onRunning={_onRunning}
                                    hwClient={hwClient}
                                />
                            )}
                        </Box>
                    )}
                    {cmdRunning && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: '50%',
                                transform: 'translateX( -50%)',
                                borderRadius: '8px',
                                width: '100%',
                            }}
                        >
                            <LinearProgress color="secondary" sx={{ width: '100%' }} />
                        </Box>
                    )}

                    {loading && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                background: 'rgba(255,255,255,0.3)',
                            }}
                        >
                            <CircularProgress />
                        </Box>
                    )}
                    {!loading && !initialReady && !promptReady && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                minWidth: '300px',
                                pt: 0,
                                px: 0,
                                pb: 0,
                                transform: 'translate(-50%, -50%)',
                                borderRadius: '8px',
                                background: 'rgba(255,255,255)',
                            }}
                        >
                            {terminalLineCount > 1 && (
                                <Box sx={{ p: 4 }}>
                                    <Typography variant="subtitle1">다른 명령이 실행중인 것 같습니다.</Typography>
                                </Box>
                            )}

                            {terminalLineCount < 1 && (
                                <>
                                    <Box p={2}>
                                        <Typography
                                            variant="subtitle1"
                                            sx={{ fontSize: '1.1rem', textAlign: 'center' }}
                                        >
                                            코딩팩과 연결이 안되는 것 같습니다.
                                        </Typography>
                                    </Box>
                                    <Box px={4}>
                                        <Typography
                                            variant="body1"
                                            sx={{ color: 'secondary.main', fontSize: '0.85rem' }}
                                        >
                                            아래 내용을 체크해주세요
                                        </Typography>
                                    </Box>
                                    <Box
                                        mt={2}
                                        sx={{
                                            pl: 4,
                                            pr: 1,
                                            maxHeight: '480px',
                                            pb: 5,
                                            overflowY: 'scroll',
                                            '& .question': {
                                                fontSize: '0.95rem',
                                                color: '#191919',
                                            },
                                            '& ul': {
                                                ml: 0,
                                                mt: 1,
                                                fontSize: '0.85rem',
                                                color: 'primary.main',
                                            },
                                        }}
                                    >
                                        <Typography variant="body1" className="question" sx={{ mt: 2 }}>
                                            1. 코딩팩의 OS 이미지를 업그래이드 하셨나요?
                                        </Typography>
                                        <ul>
                                            <li>2021년 12월 6일 이후에 배포된 OS 이미지만 지원합니다.</li>
                                            <li>코딩팩의 OS 이미지를 구워주세요.</li>
                                        </ul>
                                        <Typography variant="body1" className="question" sx={{ mt: 2 }}>
                                            2. 코딩팩이 콘솔 모드인가요?
                                        </Typography>
                                        <ul>
                                            <li>코딩팩이 콘솔 모드일 때 PC와 통신이 됩니다.</li>
                                            <li>
                                                확인을 위해 코딩팩의 버튼을 누른 채로 4~5초 정도 기다리면 음성으로
                                                알려줍니다.
                                            </li>
                                        </ul>

                                        <Typography variant="body1" sx={{ fontSize: '0.95rem' }} className="question">
                                            3. 혹시 재부팅 중인가요?
                                        </Typography>
                                        <ul>
                                            <li>잠시만 기다려주세요.</li>
                                            <li>재부팅이 완료되면 현재 화면에서 자동으로 연결됩니다.</li>
                                        </ul>
                                        <Typography variant="body1" className="question" sx={{ mt: 2 }}>
                                            4. 케이블을 연결하셨나요?
                                        </Typography>
                                        <ul>
                                            <li>케이블이 정상적으로 연결되었는지 확인해주세요.</li>
                                            <li>케이블 연결이 정상이라면 코딩팩 전원선을 뺐다가 다시 꽂아주세요.</li>
                                        </ul>
                                        <Typography variant="body1" className="question" sx={{ mt: 2 }}>
                                            5. PC용 드라이버 프로그램을 설치하셨나요?
                                        </Typography>
                                        <ul>
                                            <li>PC용 드라이버 프로그램을 설치해주세요.</li>
                                            <li>
                                                윈도우인 경우 제어판의 장치 관리자에서 장치가 인식되었는지 확인할 수
                                                있습니다.
                                            </li>
                                        </ul>
                                    </Box>
                                </>
                            )}
                        </Box>
                    )}
                </Box>
            </DialogContent>
        </Dialog>
    )
}
