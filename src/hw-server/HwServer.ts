import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs'
import { Server, Socket } from 'socket.io'
import { WEBSOCKET_LISTEN_PORT } from 'src/constants/server'
import { createSocketIoServer } from './util/createSocketIoServer'
import { HwClientHandler } from './HwClientHandler'
import { HwManager } from './HwManager'
import { RxSocketIoServer } from './util/RxSocketIoServer'

const DEFAULT_OPTIONS = {
    listenPort: WEBSOCKET_LISTEN_PORT,
}

export class HwServer {
    private _io?: Server | null = null
    private _subscription?: Subscription | null = null
    private _options: { listenPort: number }
    private _running$ = new BehaviorSubject(false)
    private readonly _hwManager: HwManager
    private _destroyTrigger$ = new Subject<any>()

    constructor(hwManager: HwManager, opts?: { listenPort: number }) {
        this._options = { ...(opts ?? DEFAULT_OPTIONS) }
        this._hwManager = hwManager
    }

    observeRunning = (): Observable<boolean> => {
        return this._running$.asObservable()
    }

    get isRunning(): boolean {
        return this._running$.value
    }

    private updateRunning = (running: boolean) => {
        if (this._running$.value !== running) {
            this._running$.next(running)
        }
    }

    start = () => {
        if (this._io) {
            console.log('already running')
            this.updateRunning(true)
            return
        }

        const io = createSocketIoServer()
        this._io = io
        this._subscription = RxSocketIoServer.fromConnectionEvent(io).subscribe((socket) => {
            HwClientHandler.start(socket, this._destroyTrigger$, this._hwManager)
        })

        const listenPort = this._options.listenPort
        console.log('websocket server start listen:', listenPort)
        io.listen(listenPort)
        this.updateRunning(true)
    }

    stop = async (): Promise<void> => {
        console.log('HwServer.stop()')
        const io = this._io
        if (!io) return
        this._destroyTrigger$.next(Date.now())
        this._subscription?.unsubscribe()
        this._subscription = null
        io.disconnectSockets(true)
        io.removeAllListeners()
        return new Promise((resolve) => {
            io.close((err) => {
                if (err) {
                    console.log('ignore, socket.io-server close error:' + err.message)
                } else {
                    console.log('socket.io-server closed')
                }
                this.updateRunning(false)
                resolve()
            })
        })
    }
}
