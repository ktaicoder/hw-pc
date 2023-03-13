import { IUiLogger } from 'src/custom-types'
import { ObservableField } from 'src/util/ObservableField'
import { WebSocket } from 'ws'
import { IHcpPacketHandler } from '../hcp-types'
import { HcpPacket } from '../HcpPacket'
import { HcpPacketHelper } from '../HcpPacketHelper'

function socketSend(sock: WebSocket, data: any) {
  sock.send(data, { binary: true })
}

function capitalize(s: string): string {
  if (s.length === 0) return ''
  if (s.length === 1) return s.toUpperCase()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

type ProcHandler = (packet: HcpPacket) => Promise<void>

export class MetaChannelHandler implements IHcpPacketHandler {
  private channelProcs_: Record<string, ProcHandler> = {}

  constructor(
    private readonly socket: WebSocket, //
    private readonly socketVerified$: ObservableField<boolean>, //
    private readonly uiLogger: IUiLogger,
  ) {
    this.channelProcs_ = {
      hello: this.onHello_,
      cmd: this.onCmd_,
    }
  }

  handle = async (packet: HcpPacket) => {
    const proc = packet.proc()
    const procHandler = this.channelProcs_[packet.proc()]
    if (!procHandler) {
      console.warn('MetaChannelHandler.handle() unknown channelCmd:' + proc)
      return
    }
    return procHandler(packet)
  }

  private onHello_ = async (packet: HcpPacket) => {
    console.log('MetaChannelHandler.onHello_() received hello, send welcome')
    socketSend(this.socket, HcpPacketHelper.createWelcomePacket())
    this.socketVerified$.setValue(true)
  }

  private onCmd_ = async (packet: HcpPacket) => {
    const requestId = packet.requestId()
    if (!requestId) {
      console.log('requestId required on channel(meta,cmd)')
      return
    }

    if (packet.contentType() !== 'json') {
      console.log(`cannot support yet ${packet.contentType()}`)
      return
    }

    if (!packet.body || packet.bodyLength() === 0) {
      console.log('cannot support yet body empty')
      return
    }

    const { cmd, args } = HcpPacketHelper.decodeBufferToJson(packet.body)
    if (cmd === 'info') {
      socketSend(
        this.socket,
        HcpPacketHelper.createJsonPacket('meta,info', {
          header: {
            requestId,
          },
          body: {
            success: true,
            foo: 'bar',
          },
        }),
      )
    }
  }
}
