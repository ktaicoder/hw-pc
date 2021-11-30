// 지원 하드웨어 목록
import wiseXboard from './hw/wiseXboard'
import codingpack from './hw/codingpack'

export const controls = {
    [wiseXboard.hwId]: wiseXboard,
    [codingpack.hwId]: codingpack,
}
