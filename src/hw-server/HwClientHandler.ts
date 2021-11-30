import { Observable, Subscription, takeUntil } from 'rxjs'
import { Socket } from 'socket.io'
import { IHwControl } from 'src/custom-types'
import { HwManager } from './HwManager'
import { RxSocketIoClient } from './util/RxSocketIoClient'

const DEBUG = true
const DEVICE_CTL_REQUEST_V2 = 'deviceCtlMsg_v2:request'
const DEVICE_CTL_RESPONSE_V2 = 'deviceCtlMsg_v2:response'
export const OPEN_TERMINAL_REQUEST = 'openTerminal:request'
export const CLOSE_TERMINAL_REQUEST = 'closeTerminal:request'
export const TERMINAL_CMD_RESPONE = 'terminalCmd:response'
export const TERMINAL_MESSAGE_RESPONSE = 'terminalTessage:response'
export const TERMINAL_MESSAGE_REQUEST = 'terminalTessage:request'

function sendError(socket: Socket, requestId: string, err: any) {
    console.log(err)
    if (socket.connected) {
        socket.send({ requestId, success: false, error: err.message })
    } else {
        console.log('cannot response, because web socket disconnect')
    }
}

// 구현못하겠다
function removeControlCharacter(data: Buffer) {
    return data
}

export type DisposeFn = () => void
export type CommandHandlerFn = () => Promise<any>

type AutoCall = {
    hwId: string
    isCalledAfterOpen: boolean
    isCalledBeforeClose: boolean
}

export class HwClientHandler {
    _subscription?: Subscription | null = null
    _socket?: Socket | null = null

    _autoCall?: AutoCall = undefined

    constructor(socket: Socket, destroyTrigger$: Observable<any>, private hwManager: HwManager) {
        this._socket = socket
        const subscription = RxSocketIoClient.fromDisconnectEvent(socket)
            .pipe(takeUntil(destroyTrigger$))
            .subscribe((reason) => {
                this.callBeforeClose()
                this.close()
            })

        subscription.add(
            RxSocketIoClient.fromMessageEvent(socket, DEVICE_CTL_REQUEST_V2)
                .pipe(takeUntil(destroyTrigger$))
                .subscribe((msg) => {
                    this.handleHwControlMessage(msg)
                }),
        )

        subscription.add(
            RxSocketIoClient.fromMessageEvent(socket, OPEN_TERMINAL_REQUEST)
                .pipe(takeUntil(destroyTrigger$))
                .subscribe((msg) => {
                    this.handleOpenTerminal(msg)
                }),
        )
        subscription.add(
            RxSocketIoClient.fromMessageEvent(socket, TERMINAL_MESSAGE_REQUEST)
                .pipe(takeUntil(destroyTrigger$))
                .subscribe((msg) => {
                    this.handleTerminalCommand(msg)
                }),
        )
        subscription.add(
            RxSocketIoClient.fromMessageEvent(socket, CLOSE_TERMINAL_REQUEST)
                .pipe(takeUntil(destroyTrigger$))
                .subscribe((msg) => {
                    this.close()
                }),
        )

        this._subscription = subscription
    }

    static start = (socket: Socket, destroyTrigger$: Observable<any>, hwManager: HwManager) => {
        const h = new HwClientHandler(socket, destroyTrigger$, hwManager)
        console.log('hw client handler started')
    }

    close = () => {
        const s = this._socket
        if (!s) return
        this._subscription?.unsubscribe()
        this._subscription = null
        s.removeAllListeners()
        this._socket = null
    }

    private callAfterOpen = async () => {
        const autoCall = this._autoCall
        if (!autoCall || autoCall.isCalledAfterOpen) return
        autoCall.isCalledAfterOpen = true
        const control = this.hwManager.findHwControl(autoCall.hwId)
        if (!control) {
            console.info('callAfterOpen(): hw not registered:' + autoCall.hwId)
            return
        }
        try {
            await this.callQuietly(control, 'onAfterOpen')
        } catch (err) {
            console.log('error:', err.messsage)
        }
    }

    private callBeforeClose = async () => {
        const autoCall = this._autoCall
        if (!autoCall || autoCall.isCalledBeforeClose) return
        autoCall.isCalledBeforeClose = true
        const control = this.hwManager.findHwControl(autoCall.hwId)
        if (!control) {
            console.info('hw registered')
            return
        }
        autoCall.isCalledBeforeClose = true
        try {
            await this.callQuietly(control, 'onBeforeClose')
        } catch (err) {
            console.log('error:', err.messsage)
        }
    }

    private handleHwControlMessage = async (message: any) => {
        const sock = this._socket
        if (!sock) {
            return
        }

        const { requestId, clientMeta, hwId, cmd, args } = message
        if (!hwId) {
            sendError(sock, requestId, new Error('invalid packet:' + JSON.stringify({ hwId, requestId, cmd })))
            return
        }

        // hwId의 컨트롤을 찾고
        const control = this.hwManager.findHwControl(hwId)
        if (!control) {
            sendError(sock, requestId, new Error('not registered hw:' + JSON.stringify({ hwId, requestId, cmd })))
            return
        }
        if (!this._autoCall) {
            this._autoCall = {
                hwId,
                isCalledAfterOpen: false,
                isCalledBeforeClose: false,
            }
        }

        if (!this._autoCall.isCalledAfterOpen) {
            await this.callAfterOpen()
        }

        // cmd 함수를 찾고
        const fn = control[cmd]
        if (!fn) {
            console.log(`ignore, unknown cmd: ${hwId}.${cmd}`, { requestId, hwId, cmd, args })
            sendError(sock, requestId, new Error(`unknown cmd: ${hwId}.${cmd}`))
            return
        }

        fn.apply(control, args)
            .then((result) => {
                let resultFrame
                if (typeof result === 'undefined' || result === null) {
                    resultFrame = { requestId, success: true }
                } else {
                    resultFrame = { requestId, success: true, body: result }
                }
                sock.emit(DEVICE_CTL_RESPONSE_V2, resultFrame)
            })
            .catch((err) => {
                sendError(sock, requestId, err)
            })
    }

    private handleTerminalCommand = async (message: any) => {
        console.log('handleTerminalCommand', message)
        const sock = this._socket
        if (!sock) {
            return
        }

        const { requestId, hwId, data, contentEncoding = 'plain' } = message
        if (!hwId) {
            sendError(sock, requestId, new Error('invalid packet:' + JSON.stringify({ hwId, requestId })))
            return
        }

        // hwId의 컨트롤을 찾고
        const control = this.hwManager.findHwControl(hwId)
        if (!control) {
            sendError(sock, requestId, new Error('not registered hw:' + JSON.stringify({ hwId, requestId })))
            return
        }
        const helper = this.hwManager.getSerialPortHelperOrNull(hwId)

        if (contentEncoding === 'base64') {
            helper?.write(Buffer.from(data, 'base64'))
        } else {
            helper?.write(data)
        }
        // helper?.serialPort?.write(data)
    }

    private handleOpenTerminal = async (message: any) => {
        console.log('handleOpenTerminal', message)
        const sock = this._socket
        if (!sock) {
            return
        }

        const { requestId, hwId } = message
        if (!hwId) {
            sendError(sock, requestId, new Error('invalid packet:' + JSON.stringify({ hwId, requestId })))
            return
        }

        // hwId의 컨트롤을 찾고
        const control = this.hwManager.findHwControl(hwId)
        if (!control) {
            sendError(sock, requestId, new Error('not registered hw:' + JSON.stringify({ hwId, requestId })))
            return
        }

        // 사전에 시리얼포트가 만들어져야 한다.
        const helper = this.hwManager.getSerialPortHelperOrNull(hwId)
        if (!helper) {
            sendError(sock, requestId, new Error('serialport not opend:' + JSON.stringify({ hwId, requestId })))
            return
        }

        const subscription = this._subscription
        if (!subscription) {
            sendError(sock, requestId, new Error('serialport not opend:' + JSON.stringify({ hwId, requestId })))
            return
        }

        sock.emit(TERMINAL_CMD_RESPONE, { requestId, success: true })
        subscription.add(
            helper.observeData().subscribe({
                next: ({ timestamp, data }) => {
                    data = removeControlCharacter(data)
                    if (DEBUG) console.log('TERMINAL_MESSAGE_RESPONSE', message)
                    sock.emit(TERMINAL_MESSAGE_RESPONSE, data.toString('utf8'))
                },
                error: (err) => {
                    sock.emit(TERMINAL_CMD_RESPONE)
                },
            }),
        )
    }

    /**
     * 하드웨어 함수를 호출하고, 에러는 무시한다.
     * onAfterOpen과 onBeforeClose는 무시한다
     */
    private callQuietly = (control: IHwControl, cmd: string, args?: any[]): Promise<any> => {
        const fn = control[cmd]!
        return fn.apply(control, args).catch(() => {})
    }
}
