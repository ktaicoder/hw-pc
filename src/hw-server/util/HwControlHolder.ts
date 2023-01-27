import { HwControlFactoryFn, IHwControl } from 'src/custom-types'

export class HwControlHolder {
  private controls_: Record<string, IHwControl> = {}

  constructor() {}

  getOrNull = (hwId: string): IHwControl | null => {
    return this.controls_[hwId] ?? null
  }

  create = (hwId: string, controlFactoryFn: HwControlFactoryFn): IHwControl => {
    let control = this.controls_[hwId]
    if (control) {
      throw new Error('already exists hwId:' + hwId)
    }
    control = controlFactoryFn()
    this.controls_[hwId] = control
    return control
  }

  remove = (hwId: string) => {
    delete this.controls_[hwId]
  }

  removeAll = () => {
    this.controls_ = {}
  }

  getHwIdList = (): string[] => {
    return Object.keys(this.controls_)
  }
}
