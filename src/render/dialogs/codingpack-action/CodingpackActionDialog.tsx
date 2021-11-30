import CloseIcon from '@mui/icons-material/Close'
import { Box, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton, LinearProgress } from '@mui/material'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useMeasure } from 'react-use'
import { bufferTime, debounceTime, filter, mergeMapTo, timer } from 'rxjs'
import { CodingpackActionKind, CodingpackActionKindKey } from 'src/domain/codingpack'
import ReactConsole, { ControlKeys, ReactConsoleControl } from 'src/render/components/react-console/ReactConsole'
import { fixWebPath } from 'src/render/util/fixWebPath'
import BluetoothSettingView from './components/BluetoothSettingView'
import CheckAudioView from './components/CheckAudioView'
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

export default function CodingpackActionDialog(props: CodingpackActionDialogProps) {
    const { actionKind, open, onClose } = props
    const [containerRef, { height: containerHeight }] = useMeasure()
    const [expand, setExpand] = useState(true)
    const [loading, setLoading] = useState(true)
    const [cmdRunning, setCmdRunning] = useState(false)
    const [minimized, setMinimized] = useState(false)
    const [connected, setConnected] = useState(false)
    const title = CodingpackActionKind[actionKind]
    const hwClient = useMemo(() => new HwClient('codingpack', 'ws://127.0.0.1:3001'), [])

    const [terminal, setTerminal] = useState<ReactConsoleControl | null>(null)

    const [inputReady, setInputReady] = useState<boolean>(false)

    const doConnect = useCallback(
        async (ctx: { canceled: boolean }) => {
            setLoading(true)
            // 연결하기
            hwClient.connect()

            try {
                console.log('웹소켓 연결을 기다리기')
                await hwClient.waitForConnected()
                console.log('웹소켓 연결이 되었습니다. 이제 터미널을 엽니다')
                await hwClient.sendOpenTerminalRequest()
                console.log('터미널이 열렸습니다')
                // 시작할때 컨트롤 d를 두번 누르고 시작한다.
                hwClient.sendBinary(new Uint8Array(ControlKeys.d))
                hwClient.sendBinary(new Uint8Array(ControlKeys.d))
                hwClient.sendText('\n')
            } catch (err) {
                console.log(err)
            } finally {
                setConnected(hwClient.isConnected())
                setLoading(false)
            }
        },
        [hwClient],
    )

    useEffect(() => {
        if (!terminal) return
        const s1 = timer(0, 300)
            .pipe(mergeMapTo(hwClient.observeTerminalPrompt()))
            .pipe(debounceTime(100))
            .subscribe((isPromptReceived) => {
                setInputReady(isPromptReceived)
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
        const ctx = { canceled: false }
        doConnect(ctx)
        return () => {
            ctx.canceled = true
            hwClient.disconnect()
        }
    }, [hwClient])

    const _onRunning = useCallback((running: boolean) => {
        setCmdRunning(running)
    }, [])

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth={expand ? 'md' : 'sm'}
            fullWidth
            sx={{
                '& .MuiPaper-root': {
                    background: '#FAFAFA',
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
                        {/* <span>@cp949</span>
                        <ArrowDropDownIcon sx={{ ml: 1, fontSize: '1rem' }} /> */}
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
                        readonly={!cmdRunning && minimized ? false : true}
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
                    {!loading && (
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
                            {actionKind === 'audio' && (
                                <CheckAudioView
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
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                background: 'rgba(255,255,255,0.5)',
                            }}
                        >
                            <CircularProgress />
                        </Box>
                    )}
                </Box>
            </DialogContent>
        </Dialog>
    )
}
