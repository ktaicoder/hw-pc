import { BehaviorSubject, Observable } from 'rxjs'
import { WebSocket, WebSocketServer, ServerOptions } from 'ws'
import { v4 as uuidv4 } from 'uuid'
import { HcpClientHandler } from './HcpClientHandler'
import { HcpHwManager } from './HcpHwManager'
import { IHwServer, IUiLogger } from 'src/custom-types'

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

  private hcpHwManager_: HcpHwManager

  private running$ = new BehaviorSubject(false)

  private readonly uiLogger_: IUiLogger

  constructor(opts: ServerOptions, uiLogger: IUiLogger, hcpHwManager: HcpHwManager) {
    this.options = { ...opts }
    this.hcpHwManager_ = hcpHwManager
    this.uiLogger_ = uiLogger
  }

  getHwId = () => {
    return this.hcpHwManager_.getHwId()
  }

  getHcpHwManager = (): HcpHwManager => {
    return this.hcpHwManager_
  }

  observeRunning = (): Observable<boolean> => {
    return this.running$.asObservable()
  }

  isRunning = () => this.running$.value === true

  start = () => {
    if (this.server_) {
      this.uiLogger_.w('HcpWebSocketServer', 'server already started')
      throw new Error('server already started')
    }

    this.uiLogger_.i('HcpWebSocketServer.start()', JSON.stringify(this.options))
    this.server_ = new WebSocketServer(this.options)
    this.server_.on('connection', this.onConnected_)
    this.running$.next(true)
  }

  private onConnected_ = (sock: WebSocket) => {
    const logTag = 'HcpWebSocketServer'
    const clientId = uuidv4()
    this.uiLogger_.i(logTag, `onConnected() ${clientId}`)
    const handler = new HcpClientHandler(clientId, sock, this.uiLogger_, this.hcpHwManager_)
    this.registerHandler_(handler)
    sock.once('close', (reason) => {
      this.unregisterHandler_(clientId)
      this.onDisconnected_(clientId, reason)
    })
  }

  private onDisconnected_ = (clientId: string, reason: number) => {
    const logTag = 'HcpWebSocketServer'
    this.uiLogger_.w(logTag, `onDisconnected() reason=${reason}, ${clientId}`)
  }

  private registerHandler_ = (handler: HcpClientHandler) => {
    this.handlers_[handler.id] = handler
  }

  private unregisterHandler_ = (id: string) => {
    delete this.handlers_[id]
  }

  stop = async () => {
    const logTag = 'HcpWebSocketServer.stop()'
    this.uiLogger_.i(logTag, 'called')
    // await Promise.all(Object.values(this.handlers_))
    for (const handler of Object.values(this.handlers_)) {
      await handler.close()
    }

    this.handlers_ = {}
    const s = this.server_
    if (s) {
      this.uiLogger_.d(logTag, 'hcp server websocket closing...')
      await new Promise<void>((resolve) => {
        s.close((err) => {
          if (err) {
            this.uiLogger_.i(logTag, `hcp server websocket close fail: ${errmsg(err)}`)
          } else {
            this.uiLogger_.d(logTag, 'hcp server websocket close success')
          }
          resolve()
        })
      })
      s.removeAllListeners()
      this.server_ = null
    }
    await this.hcpHwManager_.close()
    this.running$.next(false)
  }
}
