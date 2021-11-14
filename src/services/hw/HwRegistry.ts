import { controls } from 'src/custom'
import { IHwControl, IHwInfo, IHwOperator } from 'src/custom-types/hw-types'

type HwRegistryData = {
    info: IHwInfo
    operator: IHwOperator
    control: IHwControl
}

const HW_REGISTRY: Record<string, HwRegistryData> = {}

const registerHw = (hwId: string, info: IHwInfo, operator: IHwOperator, control: IHwControl) => {
    HW_REGISTRY[hwId] = { info, operator, control }
}

Object.entries(controls).forEach(([hwId, hw]) => {
    console.log({ hw })
    registerHw(hwId, hw.info, hw.operator, hw.control())
})

export class HwRegistry {
    static list = (): Array<HwRegistryData> => Object.values(HW_REGISTRY)

    static find = (hwId: string): HwRegistryData | undefined => HW_REGISTRY[hwId]
}
