import { drDrone } from './hw/drDrone'
import { exMarsCube } from './hw/exMarsCube'
import { saeonAl } from './hw/saeonAl'
import { saeonAltinoLite } from './hw/saeonAltinoLite'
import { saeonSmartFarm } from './hw/saeonSmartFarm'
import { wiseXboard } from './hw/wiseXboard'
import { wiseXboardPremium } from './hw/wiseXboardPremium'
import { rossiMeta } from './hw/rossiMeta'
import { uamVertiPort } from './hw/uamVertiPort'

/**
 * 지원 하드웨어 목록
 */
export const HardwareDescriptors = {
  wiseXboardPremium,
  wiseXboard,
  exMarsCube,
  saeonAltinoLite,
  saeonAl,
  saeonSmartFarm,
  drDrone,
  rossiMeta,
  uamVertiPort,
}

export type HardwareDescriptorKey = keyof typeof HardwareDescriptors
