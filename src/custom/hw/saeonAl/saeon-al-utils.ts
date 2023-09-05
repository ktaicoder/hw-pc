export const LINE_MASKS = {
  'Line-1': 0x01,
  'Line-2': 0x02,
  'Line-3': 0x04,
  'Line-4': 0x08,
  'Line-5': 0x10,
  'Line-6': 0x20,
  'Line-7': 0x40,
  'Line-8': 0x80,
} as const

export const NOTE_OCT = {
  '1-Oct': 1,
  '2-Oct': 2,
  '3-Oct': 3,
  '4-Oct': 4,
  '5-Oct': 5,
  '6-Oct': 6,
  '7-Oct': 7,
  '8-Oct': 8,
} as const

export const NOTE_SCALE = {
  'C (Do)': 1,
  'C# (Do#)': 2,
  'D (Re)': 3,
  'D# (Re#)': 4,
  'E (Mi)': 5,
  'F (Fa)': 6,
  'F# (Fa#)': 7,
  'F (Fa#)': 7, //버그인가?
  'G (Sol)': 8,
  'G# (Sol#)': 9,
  'A (La)': 10,
  'A# (La#)': 11,
  'B (Si)': 12,
  Non: 0,
} as const

export class AlOutput {
  STR = 0
  RM_H = 0
  RM_L = 0
  LM_H = 0
  LM_L = 0
  DMC = 0
  DM1 = 0
  DM2 = 0
  DM3 = 0
  DM4 = 0
  DM5 = 0
  DM6 = 0
  DM7 = 0
  DM8 = 0
  IRO_BREAK = 10 // IR Out
  BZR = 0
  LED = 0
  STM = 0 // Steering Mode
  SFV = 0 // Steering Fine Value

  /**
   * Update the output object for `stopAll`.
   */
  updateForStopAll() {
    this.STR = 0
    this.RM_H = 0
    this.RM_L = 0
    this.LM_H = 0
    this.LM_L = 0
    this.DMC = 0
    this.DM1 = 0
    this.DM2 = 0
    this.DM3 = 0
    this.DM4 = 0
    this.DM5 = 0
    this.DM6 = 0
    this.DM7 = 0
    this.DM8 = 0
    this.IRO_BREAK &= 0x0f
    this.BZR = 0
    this.LED = 0
    this.STM = 0 // Steering Mode
    this.SFV = 0 // Steering Fine Value
  }
}
