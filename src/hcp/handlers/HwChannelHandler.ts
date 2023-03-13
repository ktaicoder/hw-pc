import { filter, firstValueFrom } from 'rxjs'
import chalk from 'chalk'
import { IUiLogger } from 'src/custom-types'
import { WebSocket } from 'ws'
import { ObservableField } from '../../util/ObservableField'
import { IHcpPacketHandler } from '../hcp-types'
import { HcpHwManager } from '../HcpHwManager'
import { HcpPacket } from '../HcpPacket'
import { HcpPacketHelper } from '../HcpPacketHelper'
import { runHwControlCmd } from './runHwControlCmd'

const DEVICE_OPEN_TIMEOUT = 7000

function socketSend(sock: WebSocket, data: any) {
  sock.send(data, { binary: true })
}

type ProcHandler = (packet: HcpPacket) => Promise<void>

export class HwChannelHandler implements IHcpPacketHandler {
  private channelProcs_: Record<string, ProcHandler> = {}

  private hcpHwManager_: HcpHwManager

  constructor(
    private readonly socket: WebSocket,
    private readonly uiLogger: IUiLogger,
    private readonly hwReady$: ObservableField<boolean>,
    hcpHwManager: HcpHwManager,
  ) {
    this.channelProcs_ = {
      control: this.onControl_,
    }
    this.hcpHwManager_ = hcpHwManager
  }

  handle = async (packet: HcpPacket): Promise<void> => {
    const proc = packet.proc()
    const procHandler = this.channelProcs_[packet.proc()]
    if (!procHandler) {
      this.uiLogger.w('unknown channelCmd:', proc)
      return
    }
    return procHandler(packet)
  }

  private sendSuccessResult_ = (channel: string, requestId: string, resultData: any) => {
    socketSend(
      this.socket,
      HcpPacketHelper.createJsonPacket(channel, {
        header: {
          requestId,
        },
        body: {
          success: true,
          data: resultData,
        },
      }),
    )
  }

  private sendError_ = (channel: string, requestId: string, errorCode: string, error: any) => {
    let message: string | undefined
    if (typeof error === 'string') {
      message = error
    } else if ('message' in error) {
      message = error['message']
    }

    this.uiLogger.w(`[${channel}] sendError(): `, `errorCode=${errorCode}, message: ${message}`)
    socketSend(
      this.socket,
      HcpPacketHelper.createJsonPacket(channel, {
        header: {
          requestId,
        },
        body: {
          success: false,
          errorCode,
          message,
        },
      }),
    )
  }

  private onControl_ = async (packet: HcpPacket) => {
    const hwId = packet.hwId()
    const requestId = packet.requestId()
    if (!hwId || !requestId) {
      this.uiLogger.e('hwId and requestId missing', JSON.stringify({ hwId, requestId }))
      return
    }

    if (hwId !== this.hcpHwManager_.getHwId()) {
      this.uiLogger.w('hardware id mismatched', `request hwId:${hwId}, current hwId: ${this.hcpHwManager_.getHwId()}`)
      return
    }

    const { cmd, args = [] } = packet.bodyAsJson() as {
      hwId: string
      cmd: string
      args?: unknown[]
    }

    const device = this.hcpHwManager_.getDevice()
    if (!device) {
      this.sendError_('hw,control', requestId, 'E1_HW_CONTROL_FAIL', '하드웨어 연결 실패(1)')
      return
    }

    if (!device.isOpened()) {
      await device.waitUntilOpen(DEVICE_OPEN_TIMEOUT)
    }

    if (!device.isOpened()) {
      this.sendError_('hw,control', requestId, 'E1_HW_CONTROL_FAIL', '하드웨어 연결 실패(2)')
      return
    }

    const control = this.hcpHwManager_.getHwControl()
    const ctx = { device, uiLogger: this.uiLogger }

    if (!this.hwReady$.value) {
      await firstValueFrom(this.hwReady$.observe().pipe(filter((it) => it)))
    }

    // if (!this.onAfterOpenCalled$.value) {
    //   this.onAfterOpenCalled$.setValue(true)
    //   await control.onAfterOpen(ctx)
    // }

    try {
      const callResult = await runHwControlCmd(ctx, control, cmd, args)
      this.sendSuccessResult_('hw,control', requestId, callResult)
    } catch (err) {
      this.sendError_('hw,control', requestId, 'E1_HW_CONTROL_FAIL', err)
    }
  }
}
