import { IHwServer } from './../../custom-types/basic-types'
import { BehaviorSubject, Observable, Subject, Subscription, takeUntil } from 'rxjs'
import { Server } from 'socket.io'
import { CODINGPACK_LISTEN_PORT } from 'src/constants/server'
import { IUiLogger } from 'src/custom-types'
import { RxSocketIoServer } from 'src/util/RxSocketIoServer'
import { createSocketIoServer } from '../util/createSocketIoServer'
import { CodingpackClientHandler } from './CodingpackClientHandler'
import { CodingpackHwManager } from './CodingpackHwManager'

const DEFAULT_OPTIONS = {
  listenPort: CODINGPACK_LISTEN_PORT,
}

export class CodingpackSocketIoServer implements IHwServer {
  private io_?: Server | null = null

  private subscription_?: Subscription | null = null

  private readonly options_: { listenPort: number }

  private readonly running$ = new BehaviorSubject(false)

  private readonly hwManager_: CodingpackHwManager

  private destroyTrigger$ = new Subject<any>()

  private readonly uiLogger_: IUiLogger

  constructor(hwManager: CodingpackHwManager, uiLogger: IUiLogger, opts?: { listenPort: number }) {
    this.options_ = { ...(opts ?? DEFAULT_OPTIONS) }
    this.hwManager_ = hwManager
    this.uiLogger_ = uiLogger
  }

  getHwId = () => {
    return this.hwManager_.getHwId()
  }

  observeRunning = (): Observable<boolean> => {
    return this.running$.asObservable()
  }

  get isRunning(): boolean {
    return this.running$.value
  }

  getHwManager = (): CodingpackHwManager => {
    return this.hwManager_
  }

  private updateRunning = (running: boolean) => {
    if (this.running$.value !== running) {
      this.running$.next(running)
    }
  }

  start = () => {
    if (this.io_) {
      console.log('already running')
      this.updateRunning(true)
      return
    }

    const io = createSocketIoServer()
    this.io_ = io
    this.subscription_ = RxSocketIoServer.fromConnectionEvent(io)
      .pipe(takeUntil(this.destroyTrigger$))
      .subscribe((socket) => {
        CodingpackClientHandler.start(socket, this.destroyTrigger$, this.hwManager_)
      })

    const listenPort = this.options_.listenPort
    console.log('websocket server start listen:', listenPort)
    io.listen(listenPort)
    this.updateRunning(true)
  }

  stop = async (): Promise<void> => {
    console.log('HwServer.stop()')
    const io = this.io_
    if (!io) return
    this.io_ = undefined
    this.destroyTrigger$.next(Date.now())
    await this.hwManager_.close()
    this.subscription_?.unsubscribe()
    this.subscription_ = null
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
