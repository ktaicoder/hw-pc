import { exMarsCube } from './hw/exMarsCube'
import { saeonAl } from './hw/saeonAl'
import { saeonAltinoLite } from './hw/saeonAltinoLite'
import { wiseXboard } from './hw/wiseXboard'
import { wiseXboardPremium } from './hw/wiseXboardPremium'

/**
 * 지원 하드웨어 목록
 */
export const HardwareDescriptors = {
  wiseXboardPremium,
  wiseXboard,
  exMarsCube,
  saeonAltinoLite,
  saeonAl,
}

export type HardwareDescriptorKey = keyof typeof HardwareDescriptors
