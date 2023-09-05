import flatted from 'flatted'
import { IDevice, IHwControl } from 'src/custom-types'
import { uiLogger } from 'src/services/hw/UiLogger'
import { IHcpHwNotificationManager } from './hcp-types'

type ControlFn = (...args: any[]) => Promise<any>

export abstract class AbstractHcpHwManager {
  protected readonly hwControl_: IHwControl

  constructor(options: { hwControl: IHwControl }) {
    this.hwControl_ = options.hwControl
  }

  abstract getDevice(): IDevice | null

  runControlCmd = async (cmd: string, args: []): Promise<any> => {
    uiLogger.d(`\n[REQUEST]: ${cmd}, `, args)

    const control = this.hwControl_
    const controlFn = control[cmd] as ControlFn | undefined
    if (!controlFn) {
      uiLogger.e(`[REQUEST]: unknown command, ${cmd}, `, args)
      throw new Error('unknown control command:' + cmd)
    }

    const newCtx = { device: this.getDevice() }
    const result = await controlFn.call(control, newCtx, ...args)
    uiLogger.d(
      `[RESPONSE] ${cmd}, `,
      typeof result === 'undefined' ? 'void' : flatted.toJSON(result),
    )
    return result
  }

  async onWebSocketDisconnected(): Promise<void> {
    const control = this.hwControl_
    const device = this.getDevice()
    if (device) {
      await control.onWebSocketDisconnected({ device })
    }
  }

  async onWebSocketConnected(options: {
    device: IDevice
    notificationManager: IHcpHwNotificationManager
  }): Promise<void> {
    const { device, notificationManager } = options
    const control = this.hwControl_

    // 하드웨어에 웹소켓이 연결되었음을 알림
    await control.onWebSocketConnected({ device, notificationManager })
  }
}
