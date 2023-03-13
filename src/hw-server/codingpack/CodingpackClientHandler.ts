import { BehaviorSubject, filter, merge, Observable, Subscription, take, takeUntil, tap } from 'rxjs'
import { Socket } from 'socket.io'
import { ISerialDevice, IUiLogger } from 'src/custom-types'
import { codingpackCommands } from 'src/domain/codingpack'
import { RxSocketIo } from 'src/util/RxSocketIo'
import { CodingpackHwManager } from './CodingpackHwManager'
import { RxCodingpackTerminal } from './RxCodingpackTerminal'

const DEBUG = false

const {
  OPEN_TERMINAL_REQUEST,
  CLOSE_TERMINAL_REQUEST,
  TERMINAL_CMD_RESPONE,
  TERMINAL_MESSAGE_RESPONSE,
  TERMINAL_MESSAGE_REQUEST,
} = codingpackCommands

function sendError(socket: Socket, requestId: string, err: any) {
  console.log(err)
  if (socket.connected) {
    socket.send({ requestId, success: false, error: err.message })
  } else {
    console.log('cannot response, because web socket disconnect')
  }
}

export class CodingpackClientHandler {
  private subscription_?: Subscription | null = null

  private termOpenSubscription_?: Subscription | null = null

  private readonly socket_: Socket

  private readonly hwManager_: CodingpackHwManager

  private readonly closeTrigger$ = new BehaviorSubject(false)

  // 외부에서 받은 객체
  private readonly stopTrigger$: Observable<any>

  private readonly uiLogger_: IUiLogger

  /**
   * onWebSocketDisconnected() 가 호출되었으면 true이다
   * 중복호출하지 않기 위한 변수
   */
  private onWebSocketDisconnectedCalled_ = false

  constructor(
    socket: Socket, //
    stopTrigger$: Observable<any>,
    hwManager: CodingpackHwManager,
  ) {
    this.socket_ = socket
    this.hwManager_ = hwManager
    this.stopTrigger$ = stopTrigger$

    // 하드웨어 연결
    this.subscription_ = this.hwManager_
      .observeConnectedDevice() //
      .pipe(
        takeUntil(this.destroyTrigger_()),
        take(1), //
      )
      .subscribe((device) => {
        this.callWebSocketConnected_(device)
      })

    socket.on(TERMINAL_MESSAGE_REQUEST, (msg) => {
      this.handleTerminalCommand_(msg)
    })

    socket.on(OPEN_TERMINAL_REQUEST, (msg) => {
      this.handleOpenTerminal_(msg)
    })

    socket.on(CLOSE_TERMINAL_REQUEST, () => {
      this.handleCloseTerminal_()
    })
  }

  private destroyTrigger_ = () => {
    return merge(
      this.closeTrigger$.pipe(filter((it) => it)), //
      this.stopTrigger$,
    ).pipe(take(1))
  }

  static start = (socket: Socket, stopTrigger$: Observable<any>, hwManager: CodingpackHwManager) => {
    const h = new CodingpackClientHandler(socket, stopTrigger$, hwManager)
  }

  /**
   * onWebSocketConnected()를 호출합니다.
   * 웹소켓 클라이언트가 연결되었고, device가 오픈되었을때 호출됩니다.
   */
  private callWebSocketConnected_ = (device: ISerialDevice) => {
    console.log('codingpack callWebSocketConnected_()')
    const control = this.hwManager_.getHwControl()

    // 하드웨어에 웹소켓이 연결되었음을 알림
    control.onWebSocketConnected({ device, uiLogger: this.uiLogger_ })

    // 웹소켓 연결이 끊어지면, onWebSocketDisconnected()호출
    const subscription = RxSocketIo.fromDisconnectEvent(this.socket_) //
      .pipe(takeUntil(this.destroyTrigger_()))
      .subscribe(() => this.callWebSocketDisconnected_())

    this.subscription_ = this.subscription_ ?? new Subscription()
    this.subscription_.add(subscription)
  }

  /**
   * onWebSocketDisconnected()를 호출합니다.
   * 웹소켓 클라이언트의 연결이 끊어졌을때 호출됩니다.
   */
  private callWebSocketDisconnected_ = async () => {
    if (!this.onWebSocketDisconnectedCalled_) {
      console.log('codingpack callWebSocketDisconnected_()')
      this.onWebSocketDisconnectedCalled_ = true
      const control = this.hwManager_.getHwControl()
      const device = this.hwManager_.getConnectedDevice()
      if (device) {
        await control.onWebSocketDisconnected({ device, uiLogger: this.uiLogger_ })
      }
    }
  }

  private getDeviceOrWait_ = async (): Promise<ISerialDevice | null> => {
    const device = this.hwManager_.getDevice()
    if (!device) {
      return null
    }

    if (!device.isOpened()) {
      await device.waitUntilOpen(7000)
    }

    return device
  }

  private handleTerminalCommand_ = async (message: any) => {
    const sock = this.socket_

    const { requestId, hwId, data, contentEncoding = 'plain' } = message
    if (!hwId) {
      sendError(sock, requestId, new Error('invalid packet:' + JSON.stringify({ hwId, requestId })))
      return
    }

    if (DEBUG) console.log('handleTerminalCommand', { hwId, requestId })

    const device = await this.getDeviceOrWait_()
    if (!device) {
      sendError(sock, requestId, new Error('serialport not selected:' + JSON.stringify({ hwId, requestId })))
      return
    }

    if (!device.isOpened()) {
      sendError(sock, requestId, new Error('serialport not opend:' + JSON.stringify({ hwId, requestId })))
      return
    }

    if (contentEncoding === 'base64') {
      device.write(Buffer.from(data, 'base64'))
    } else {
      device.write(data)
    }
  }

  private handleOpenTerminal_ = async (message: any) => {
    const sock = this.socket_
    if (!sock) {
      return
    }

    const { requestId, hwId } = message
    if (!hwId) {
      sendError(sock, requestId, new Error('invalid packet:' + JSON.stringify({ hwId, requestId })))
      return
    }

    console.log('handleOpenTerminal', { hwId, requestId })
    const device = await this.getDeviceOrWait_()
    if (!device) {
      sendError(sock, requestId, new Error('serialport not selected:' + JSON.stringify({ hwId, requestId })))
      return
    }

    if (!device.isOpened()) {
      sendError(sock, requestId, new Error('serialport not opend:' + JSON.stringify({ hwId, requestId })))
      return
    }

    sock.emit(TERMINAL_CMD_RESPONE, { requestId, success: true })

    if (this.termOpenSubscription_) {
      this.termOpenSubscription_.unsubscribe()
      this.termOpenSubscription_ = undefined
    }

    this.termOpenSubscription_ = RxCodingpackTerminal.serialToSocket(device).subscribe({
      next: (lineBuffer) => {
        if (DEBUG) console.log('TERMINAL_MESSAGE_RESPONSE', lineBuffer.toString('utf8'))
        sock.emit(TERMINAL_MESSAGE_RESPONSE, lineBuffer.toString('utf8'))
      },
      error: (err) => {
        console.log('error:' + err.message)
      },
    })
  }

  private handleCloseTerminal_ = async () => {
    console.log('handleCloseTerminal_')
    this.close()
  }

  close = async () => {
    this.uiLogger_.i('HcpClientHandler.close()', 'called')
    if (this.termOpenSubscription_) {
      this.termOpenSubscription_.unsubscribe()
      this.termOpenSubscription_ = undefined
    }
    await this.callWebSocketDisconnected_()
    this.subscription_?.unsubscribe()
    this.subscription_ = null
    this.socket_.removeAllListeners()
    this.closeTrigger$.next(true)
    await this.hwManager_.close()
  }
}
