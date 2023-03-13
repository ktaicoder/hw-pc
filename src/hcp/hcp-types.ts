import { HcpPacket } from './HcpPacket'

export interface HwControlRequest {
  cmd: string
  args?: unknown[]
}

export interface HwControlResponse {
  success: boolean
  message?: string
  errorCode?: string
  data?: any
}

export interface IHcpPacketHandler {
  handle(packet: HcpPacket): Promise<void>
}
