import { Observable, Subscription, takeUntil } from 'rxjs'
import { Socket } from 'socket.io'
import { IHwCmdRequest } from 'src/custom-types'
import { HwManager } from './HwManager'
import { RxSocketIoClient } from './util/RxSocketIoClient'

const DEBUG = true
const DEVICE_CTL_REQUEST_V2 = 'deviceCtlMsg_v2:request'
const DEVICE_CTL_RESPONSE_V2 = 'deviceCtlMsg_v2:response'

function sendError(socket: Socket, requestId: string, err: any) {
    console.log(err)
    if (socket.connected) {
        socket.send({ requestId, success: false, error: err.message })
    } else {
        console.log('cannot response, because web socket disconnect')
    }
}

export type DisposeFn = () => void
export type CommandHandlerFn = () => Promise<any>

export type DeviceControlRequest = {
    type: 'deviceCtl'
    body: IHwCmdRequest
}

export type WebSocketRequestPayload = DeviceControlRequest

export class HwClientHandler {
    _subscription?: Subscription | null = null
    _socket?: Socket | null = null

    constructor(socket: Socket, destroyTrigger$: Observable<any>, private hwManager: HwManager) {
        this._socket = socket
        const subscription = RxSocketIoClient.fromDisconnectEvent(socket)
            .pipe(takeUntil(destroyTrigger$))
            .subscribe((reason) => {
                this.close()
            })
        RxSocketIoClient.fromMessageEvent(socket, DEVICE_CTL_REQUEST_V2)
            .pipe(takeUntil(destroyTrigger$))
            .subscribe((msg) => {
                this.handleMessage(msg)
            })
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

    handleMessage = async (message: any) => {
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
        const control = this.hwManager.findHwControl(hwId) ?? {}
        if (!control) {
            sendError(sock, requestId, new Error('not registered hw:' + JSON.stringify({ hwId, requestId, cmd })))
            return
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
}
