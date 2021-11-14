import { BehaviorSubject, Observable } from 'rxjs'
import { Server, Socket } from 'socket.io'
import { WEBSOCKET_LISTEN_PORT } from 'src/constants/server'
import { createSocketIoServer } from './createSocketIoServer'
import { HwRequestHandler } from './HwRequestHandler'

const DEVICE_CTL_REQUEST_V2 = 'deviceCtlMsg_v2:request'
const DEVICE_CTL_RESPONSE_V2 = 'deviceCtlMsg_v2:response'

const DEFAULT_OPTIONS = {
    listenPort: WEBSOCKET_LISTEN_PORT,
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
        const requestHandler = this.requestHandler

        const onMessage = async function (msg) {
            console.log(DEVICE_CTL_REQUEST_V2, msg)
            requestHandler.handle(socket, msg)
        }
        socket.on(DEVICE_CTL_REQUEST_V2, onMessage)

        const onDisconnect = async (reason: string) => {
            console.log('on disconnect reason:', reason)
            socket.off(DEVICE_CTL_REQUEST_V2, onMessage)
            socket.removeAllListeners()
        }
        socket.once('disconnect', onDisconnect)
    }

    private setupWebsocket() {
        console.log('HwServer.setupWebsocket()')
        const io = this._io
        io.on('connection', this._onConnection)

        const listenPort = this._options.listenPort
        console.log('websocket server start listen:', listenPort)
        io.listen(listenPort)
        this._running$.next(true)
    }

    async stop(): Promise<void> {
        console.log('HwServer.stop()')
        const io = this._io
        io.disconnectSockets(true)
        io.off('connection', this._onConnection)
        io.removeAllListeners()
        io.close((err) => {
            if (err) {
                console.log('ignore, socket.io-server close error:' + err.message)
            } else {
                console.log('socket.io-server closed')
            }
            this._running$.next(false)
        })
    }
}
