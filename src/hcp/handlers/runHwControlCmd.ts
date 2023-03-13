import { ISerialDevice, IUiLogger } from 'src/custom-types'
import { DummyUiLogger } from 'src/services/hw/UiLogger'

type RunContext = {
  uiLogger?: IUiLogger
  device: ISerialDevice
}

type ControlFn = (...args: any[]) => Promise<any>

const dummyLogger = new DummyUiLogger()

export async function runHwControlCmd(ctx: RunContext, control: any, cmd: string, args: any[]): Promise<any> {
  const { uiLogger = dummyLogger } = ctx

  const controlFn = control[cmd] as ControlFn | undefined
  uiLogger.d(`\n[REQUEST]: ${cmd}, `, args)

  if (!controlFn) {
    uiLogger.e(`[REQUEST]: unknown command, ${cmd}, `, args)
    throw new Error('unknown control command:' + cmd)
  }

  const newCtx = { uiLogger, device: ctx.device }
  const result = await controlFn.call(control, newCtx, ...args)
  uiLogger.d(`[RESPONSE] ${cmd}, `, typeof result === 'undefined' ? 'void' : JSON.stringify(result))
  return result
}
