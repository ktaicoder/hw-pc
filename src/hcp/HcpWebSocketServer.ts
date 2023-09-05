import { BehaviorSubject, Observable } from 'rxjs'
import { IHwServer } from 'src/custom-types'
import { uiLogger } from 'src/services/hw/UiLogger'
import { v4 as uuidv4 } from 'uuid'
import { ServerOptions, WebSocket, WebSocketServer } from 'ws'
import { HcpClientHandler } from './HcpClientHandler'
import { IHcpHwManager } from './hcp-types'

function errmsg(err: any): string {
  if (typeof err === undefined || err === null) return ''
  if (typeof err === 'string') return err
  const msg = 'message' in err ? err['message'] : err
  return msg.toString()
}

export class HcpWebSocketServer implements IHwServer {
  serverKind = 'hcp' as const

  private options: ServerOptions

  private server_: WebSocketServer | null = null

  private handlers_: Record<string, HcpClientHandler> = {}

  private readonly hwManager_: IHcpHwManager

  private readonly running$ = new BehaviorSubject(false)

  private readonly clientCount$: BehaviorSubject<number>

  constructor(
    opts: ServerOptions,
    clientCount$: BehaviorSubject<number>,
    hcpHwManager: IHcpHwManager,
  ) {
    this.options = { ...opts }
    this.hwManager_ = hcpHwManager
    this.clientCount$ = clientCount$
  }

  getHwId = () => {
    return this.hwManager_.getHwId()
  }

  getHcpHwManager = (): IHcpHwManager => {
    return this.hwManager_
  }

  observeRunning = (): Observable<boolean> => {
    return this.running$.asObservable()
  }

  isRunning = () => this.running$.value === true

  start = () => {
    if (this.server_) {
      uiLogger.w('HcpWebSocketServer', 'server already started')
      throw new Error('server already started')
    }

    uiLogger.i('HcpWebSocketServer.start()', JSON.stringify(this.options))
    this.server_ = new WebSocketServer(this.options)
    this.server_.on('connection', this.onConnected_)
    this.running$.next(true)
  }

  private onConnected_ = (sock: WebSocket) => {
    const logTag = 'HcpWebSocketServer'
    const clientId = uuidv4()
    uiLogger.i(logTag, `onConnected() ${clientId}`)
    const handler = new HcpClientHandler(clientId, sock, this.hwManager_)
    this.registerHandler_(handler)
    this.clientCount$.next(this.clientCount$.value + 1)
    sock.once('close', (reason) => {
      this.unregisterHandler_(clientId)
      this.onDisconnected_(clientId, reason)
    })
  }

  private onDisconnected_ = (clientId: string, reason: number) => {
    const logTag = 'HcpWebSocketServer'
    uiLogger.w(logTag, `onDisconnected() reason=${reason}, ${clientId}`)
    this.clientCount$.next(this.clientCount$.value - 1)
  }

  private registerHandler_ = (handler: HcpClientHandler) => {
    this.handlers_[handler.id] = handler
  }

  private unregisterHandler_ = (id: string) => {
    delete this.handlers_[id]
  }

  stop = async () => {
    const logTag = 'HcpWebSocketServer.stop()'
    uiLogger.i(logTag, 'called')
    // await Promise.all(Object.values(this.handlers_))
    for (const handler of Object.values(this.handlers_)) {
      await handler.close()
    }

    this.handlers_ = {}
    const s = this.server_
    if (s) {
      uiLogger.d(logTag, 'hcp server websocket closing...')
      await new Promise<void>((resolve) => {
        s.close((err) => {
          if (err) {
            uiLogger.i(logTag, `hcp server websocket close fail: ${errmsg(err)}`)
          } else {
            uiLogger.d(logTag, 'hcp server websocket close success')
          }
          resolve()
        })
      })
      s.removeAllListeners()
      this.server_ = null
    }
    this.clientCount$.next(0)
    await this.hwManager_.close()
    this.running$.next(false)
  }
}
