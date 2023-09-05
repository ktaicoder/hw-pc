import { HardwareDescriptorKey } from 'src/custom'

export type HWID = 'codingpack' | HardwareDescriptorKey

export type HwServerState =
  | {
      hwId: string
      running: true
    }
  | {
      hwId: undefined
      running: false
    }
