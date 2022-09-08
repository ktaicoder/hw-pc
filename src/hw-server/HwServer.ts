import { BehaviorSubject, Observable, Subject, Subscription } from 'rxjs'
import { Server } from 'socket.io'
import { WEBSOCKET_LISTEN_PORT } from 'src/constants/server'
import { HwClientHandler } from './HwClientHandler'
import { HwManager } from './HwManager'
import { createSocketIoServer } from './util/createSocketIoServer'
import { RxSocketIoServer } from './util/RxSocketIoServer'

const DEFAULT_OPTIONS = {
    listenPort: WEBSOCKET_LISTEN_PORT,
}

export class HwServer {
    private io_?: Server | null = null
    private subscription_?: Subscription | null = null
    private options_: { listenPort: number }
    private running$ = new BehaviorSubject(false)
    private readonly hwManager_: HwManager
    private destroyTrigger$ = new Subject<any>()

    constructor(hwManager: HwManager, opts?: { listenPort: number }) {
        this.options_ = { ...(opts ?? DEFAULT_OPTIONS) }
        this.hwManager_ = hwManager
    }

    observeRunning = (): Observable<boolean> => {
        return this.running$.asObservable()
    }

    get isRunning(): boolean {
        return this.running$.value
    }

    private updateRunning_ = (running: boolean) => {
        if (this.running$.value !== running) {
            this.running$.next(running)
        }
    }

    start = () => {
        console.log('XXX hwServer started')
        if (this.io_) {
            console.log('already running')
            this.updateRunning_(true)
            return
        }

        const io = createSocketIoServer()
        this.io_ = io
        this.subscription_ = RxSocketIoServer.fromConnectionEvent(io).subscribe((socket) => {
            HwClientHandler.start(socket, this.destroyTrigger$, this.hwManager_)
        })

        const listenPort = this.options_.listenPort
        console.log('websocket server start listen:', listenPort)
        io.listen(listenPort)
        this.updateRunning_(true)
    }

    stop = async (): Promise<void> => {
        console.log('HwServer.stop()')
        this.destroyTrigger$.next(Date.now())
        if (this.subscription_) {
            this.subscription_.unsubscribe()
            this.subscription_ = null
        }
        const io = this.io_
        this.io_ = undefined
        if (!io) {
            this.updateRunning_(false)
            return
        }

        io.disconnectSockets(true)
        io.removeAllListeners()
        return new Promise((resolve) => {
            io.close((err) => {
                if (err) {
                    console.log('ignore, socket.io-server close error:' + err.message)
                } else {
                    console.log('socket.io-server closed')
                }
                this.updateRunning_(false)
                resolve()
            })
        })
    }
}
