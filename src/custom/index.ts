// 지원 하드웨어 목록
import wiseXboard from './hw/wiseXboard'
import wiseXboardPremium from './hw/wiseXboardPremium'
import codingpack from './hw/codingpack'
import exMarsCube from './hw/exMarsCube'

export const controls = {
  [wiseXboardPremium.hwId]: wiseXboardPremium,
  [wiseXboard.hwId]: wiseXboard,
  [codingpack.hwId]: codingpack,
  [exMarsCube.hwId]: exMarsCube,
}
