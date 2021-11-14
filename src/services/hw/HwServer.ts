import { BehaviorSubject, Observable } from 'rxjs'
import { Server, Socket } from 'socket.io'
import { createSocketIoServer } from './createSocketIoServer'
import { HwRequestHandler } from './HwRequestHandler'

const DEVICE_CTL_REQUEST_V2 = 'deviceCtlMsg_v2:request'
const DEVICE_CTL_RESPONSE_V2 = 'deviceCtlMsg_v2:response'

const DEFAULT_OPTIONS = {
    listenPort: 3000,
}

export class HwServer {
    private _io: Server
    private _options: { listenPort: number }
    private _running$ = new BehaviorSubject(false)

    constructor(
        public hwId: string, //
        public requestHandler: HwRequestHandler,
        opts?: { listenPort: number },
    ) {
        this._options = { ...(opts ?? DEFAULT_OPTIONS) }
        this._io = createSocketIoServer()
        this.setupWebsocket()
    }

    observeRunning = (): Observable<boolean> => {
        return this._running$.asObservable()
    }

    // TODO onError
    private _onConnection = async (socket: Socket) => {
        socket.on(DEVICE_CTL_REQUEST_V2, async function (msg) {
            console.log(DEVICE_CTL_REQUEST_V2, msg)
            this.requestHandler.handle(socket, msg)
        })
    }

    private _onDisconnect = async (reason: string) => {
        console.log('on disconnect', reason)
    }

    private setupWebsocket() {
        const io = this._io
        io.on('connection', this._onConnection)
        io.on('disconnect', this._onDisconnect)

        const listenPort = this._options.listenPort
        console.log('websocket server start listen:', listenPort)
        io.listen(listenPort)
        this._running$.next(true)
    }

    stop(): Promise<void> {
        const io = this._io
        io.removeAllListeners()
        return new Promise<void>((resolve) => {
            io.close((err) => {
                if (err) {
                    console.log('ignore, websocket server close error:' + err.message)
                } else {
                    console.log('websocket server closed')
                }
                this._running$.next(false)
                resolve()
            })
        })
    }
}
