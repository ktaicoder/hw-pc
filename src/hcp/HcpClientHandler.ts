import { BehaviorSubject, combineLatest, filter, map, switchMap, take, takeUntil } from 'rxjs'
import { IDevice } from 'src/custom-types'
import { uiLogger } from 'src/services/hw/UiLogger'
import { WebSocket } from 'ws'
import { ObservableField } from '../util/ObservableField'
import { HcpHwNotificationManager } from './HcpNotificationManager'
import { HcpPacket } from './HcpPacket'
import { HcpPacketHelper } from './HcpPacketHelper'
import { HwChannelHandler } from './handlers/HwChannelHandler'
import { MetaChannelHandler } from './handlers/MetaChannelHandler'
import { HwNotificationPayload } from './hcp-notification-payload'
import { IHcpHwManager, IHcpPacketHandler } from './hcp-types'

const DEBUG = false

/**
 * 웹소켓 클라이언트 핸들러
 * 하드웨어 control의 onWebSocketConnected()/Disconnected()를 호출할 책임이 있다
 */
export class HcpClientHandler {
  private readonly channelHandlers_: Record<string, IHcpPacketHandler>

  private readonly socket_: WebSocket

  private readonly hcpHwManager_: IHcpHwManager

  /**
   * 하드웨어
   * onWebSocketConnected()가 호출되었으면 hwReady=true가 된다
   */
  private readonly hwReady$ = new ObservableField(false)

  /**
   * 하드웨어 제어 명령을 최초 받은 경우 true가 된다
   */
  private readonly hasReceivedHwCmd$ = new ObservableField(false)

  /**
   * 웹소켓 클라이언트가 hello를 메시지 보냈으면 verified=true가 된다
   */
  private readonly socketVerified$ = new ObservableField(false)

  private readonly destroyTrigger$ = new BehaviorSubject(false)

  private readonly notificationManager = new HcpHwNotificationManager()

  /**
   * onWebSocketDisconnected() 가 호출되었으면 true이다
   * 중복호출하지 않기 위한 변수
   */
  private onWebSocketDisconnectedCalled_ = false

  constructor(
    public readonly id: string, //
    socket: WebSocket,
    hcpHwManager: IHcpHwManager,
  ) {
    this.channelHandlers_ = {
      hw: new HwChannelHandler(socket, this.hwReady$, hcpHwManager),
      meta: new MetaChannelHandler(socket, this.socketVerified$),
    }
    this.socket_ = socket
    this.hcpHwManager_ = hcpHwManager
    this.startHandling_()
  }

  private startHandling_ = () => {
    this.socket_.on('message', (buffer: Buffer) => {
      const msg = HcpPacketHelper.parseBuffer(new Uint8Array(buffer))
      if (msg) {
        this.dispatchToChannelHandler_(msg)
      }
    })

    // 하드웨어 연결이 되었고,
    // 웹소켓이 verified 되었으면 onWebSocketConnected() 호출
    combineLatest([
      // 하드웨어 연결
      this.hcpHwManager_.observeConnectedDevice().pipe(take(1)),

      // hello, welcome 통신을 한 경우
      this.socketVerified$.observe().pipe(
        filter((it) => it),
        take(1),
      ),

      // 최초 하드웨어 명령을 받은 경우
      this.hasReceivedHwCmd$.observe().pipe(
        filter((it) => it),
        take(1),
      ),
    ])
      .pipe(
        map(([device]) => device),
        takeUntil(this.destroyTrigger$.pipe(filter((it) => it))),
      )
      .subscribe((device) => {
        this.callWebSocketConnected_(device)
      })

    // 하드웨어 연결이 되었고,
    // 웹소켓이 verified 되었으면 하드웨어 notification을 시작
    combineLatest([
      // 하드웨어 연결
      this.hcpHwManager_.observeConnectedDevice().pipe(take(1)),

      // hello, welcome 통신을 한 경우
      this.socketVerified$.observe().pipe(
        filter((it) => it),
        take(1),
      ),
    ])
      .pipe(
        map(([device]) => device),
        switchMap((device) => this.notificationManager.observe()),
        takeUntil(this.destroyTrigger$.pipe(filter((it) => it))),
      )
      .subscribe((notification) => {
        this.sendHwNotification_(notification)
      })
  }

  private sendHwNotification_ = (body: HwNotificationPayload) => {
    // console.log('HcpClientHandler.sendHwNotification_', body)
    this.socket_.send(HcpPacketHelper.createJsonPacket('hw,notify', { body }), { binary: true })
  }

  /**
   * onWebSocketConnected()를 호출합니다.
   * 웹소켓 클라이언트가 연결되었고, device가 오픈되었을때 호출됩니다.
   */
  private callWebSocketConnected_ = async (device: IDevice) => {
    await this.hcpHwManager_.onWebSocketConnected({
      device,
      notificationManager: this.notificationManager,
    })
    this.hwReady$.setValue(true)

    // 웹소켓 연결이 끊어지면, onWebSocketDisconnected()호출
    this.socket_.once('close', (reason) => {
      this.callWebSocketDisconnected_()
    })
  }

  /**
   * onWebSocketDisconnected()를 호출합니다.
   * 웹소켓 클라이언트의 연결이 끊어졌을때 호출됩니다.
   */
  private callWebSocketDisconnected_ = async () => {
    if (!this.onWebSocketDisconnectedCalled_) {
      this.onWebSocketDisconnectedCalled_ = true
      await this.hcpHwManager_.onWebSocketDisconnected()
    }
  }

  /**
   * hcp packet을 적절한 핸들러에 dispatch 합니다.
   */
  private dispatchToChannelHandler_ = (msg: HcpPacket) => {
    if (DEBUG) console.log('HcpClientHandler.dispatchToChannelHandler_()', msg.channelId())
    // uiLogger.d('HcpClientHandler.dispatchToChannelHandler_()', msg.toString())
    if (msg.channelId() === 'hw' && !this.hasReceivedHwCmd$.value) {
      this.hasReceivedHwCmd$.setValue(true)
    }

    const handler = this.channelHandlers_[msg.channelId()]
    if (handler) {
      handler.handle(msg)
    } else {
      console.log('unknown msg:', msg)
      uiLogger.w('HcpClientHandler.dispatchToChannelHandler_() unknown msg', msg.toString())
    }
  }

  close = async () => {
    uiLogger.i('HcpClientHandler.close()', 'called')
    await this.callWebSocketDisconnected_()
    this.socket_.close()
    this.socket_.removeAllListeners()
    this.destroyTrigger$.next(true)
  }
}
