import { Subscription } from 'rxjs'
import { SerialPortHelper } from 'src/custom-types'

export class HwSerialPortHolder {
  private helpers_: Record<string, SerialPortHelper> = {}
  private subscriptions_: Record<string, Subscription> = {}

  constructor() {}

  getOrNull = (hwId: string): SerialPortHelper | null => {
    return this.helpers_[hwId] ?? null
  }

  create = (hwId: string, factoryFn: () => SerialPortHelper) => {
    let helper = this.helpers_[hwId]
    if (helper) {
      throw new Error('already exists serialport:' + hwId)
    }

    this.subscriptions_[hwId]?.unsubscribe()

    helper = factoryFn()
    this.helpers_[hwId] = helper
    this.subscriptions_[hwId] = helper.observeState().subscribe((state) => {
      console.log('HwSerialPortHolder seriaport state changed:' + state)
      if (state !== 'first' && state !== 'opened') {
        const mgr = this
        setTimeout(() => {
          console.log('HwSerialPortHolder auto remove serialportHelper:' + hwId)
          mgr.removeByHwId(hwId)
        }, 0)
      }
    })

    return helper
  }

  removeByHwId = (hwId: string) => {
    const helper = this.helpers_[hwId]
    if (helper) {
      helper.close()
      delete this.helpers_[hwId]
    }
    const subscription = this.subscriptions_[hwId]
    if (subscription) {
      subscription.unsubscribe()
      delete this.subscriptions_[hwId]
    }
  }

  removeAll = () => {
    Object.values(this.helpers_).forEach((helper) => {
      helper.close()
    })
    this.helpers_ = {}
  }
}
