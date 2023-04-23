import { wiseXboard } from './hw/wiseXboard'
import { wiseXboardPremium } from './hw/wiseXboardPremium'
import { exMarsCube } from './hw/exMarsCube'
import { saeonAltinoLite } from './hw/saeonAltinoLite'
import { saeonAl } from './hw/saeonAl'
import { IHwDescriptor } from 'src/custom-types'

/**
 * 지원 하드웨어 목록
 */
export const HardwareDescriptors: Record<string, IHwDescriptor> = {
  wiseXboardPremium,
  wiseXboard,
  exMarsCube,
  saeonAltinoLite,
  saeonAl,
}
