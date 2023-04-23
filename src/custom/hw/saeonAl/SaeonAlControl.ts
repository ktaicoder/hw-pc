import {
  BehaviorSubject,
  EMPTY,
  filter,
  interval,
  map,
  Observable,
  sampleTime,
  Subscription,
  switchMap,
  take,
  takeUntil,
} from 'rxjs'
import { AbstractHwConrtol } from '../AbstractHwControl'
import { ISaeonAlControl } from './ISaeonAlControl'

const TRACE = false

const sensors = {
  CDS: 0,
  ACC_X: 0,
  ACC_Y: 0,
  ACC_Z: 0,
  MAG_X: 0,
  MAG_Y: 0,
  MAG_Z: 0,
  GYR_X: 0,
  GYR_Y: 0,
  GYR_Z: 0,
  IR1: 0,
  IR2: 0,
  IR3: 0,
  IR4: 0,
  IR5: 0,
  IR6: 0,
  TEMP: 0,
  LMC: 0,
  RMC: 0,
  STC: 0,
  BAT: 0,
}

const output = {
  STR: 0,
  RM_H: 0,
  RM_L: 0,
  LM_H: 0,
  LM_L: 0,
  DMC: 0,
  DM1: 0,
  DM2: 0,
  DM3: 0,
  DM4: 0,
  DM5: 0,
  DM6: 0,
  DM7: 0,
  DM8: 0,
  IRO_BREAK: 10, // IR Out
  BZR: 0,
  LED: 0,
  STM: 0, // Steering Mode
  SFV: 0, // Steering Fine Value
}

export class SaeonAlControl extends AbstractHwConrtol implements ISaeonAlControl {
  private tx_d = [
    0x02, // 0
    28, // 1
    0, // 2
    0, // 3
    10, // 4
    0, // 5
    0, // 6
    0, // 7
    0, // 8
    0, // 9
    0, // 10
    0, // 11
    0, // 12
    0, // 13
    0, // 14
    0, // 15
    0, // 16
    0, // 17
    0, // 18
    0, // 19
    0, // 20
    10, // 21
    0, // 22
    0, // 23
    1, // 24
    0, // 25
    0xff, // 26
    0x03, // 0
  ]
  private rx_d = [
    0, // 0
    0, // 1
    0, // 2
    0, // 3
    0, // 4
    0, // 5
    0, // 6
    0, // 7
    0, // 8
    0, // 9
    0, // 10
    0, // 11
    0, // 12
    0, // 13
    0, // 14
    0, // 15
    0, // 16
    0, // 17
    0, // 18
    0, // 19
    0, // 20
    0, // 21
    0, // 22
    0, // 23
    0, // 24
    0, // 25
    0, // 26
    0, // 27
    0, // 28
    0, // 29
    0, // 30
    0, // 31
    0, // 32
    0, // 33
    0, // 34
    0, // 35
    0, // 36
    0, // 37
    0, // 38
    0, // 39
    0, // 40
    0, // 41
    0, // 42
    0, // 43
    0, // 44
    0, // 45
    0, // 46
    0, // 47
    0, // 48
    0, // 49
    0, // 50
    0, // 51
    0, // 52
    0, // 53
    0, // 54
    0, // 55
  ]

  private rxSubscription_: Subscription | undefined

  private txSubscription_: Subscription | undefined

  private stopped$ = new BehaviorSubject(false)

  private closeTrigger = (): Observable<any> => {
    return this.stopped$.pipe(
      filter((it) => it === true),
      take(1),
    )
  }

  private txLoop_ = (ctx: any) => {
    const logTag = 'SaeonAlControl.txLoop_()'
    this.log(ctx).i(logTag, 'start')

    const device = this.device_(ctx)

    const stateHolder = {
      writing: false,
    }

    this.txSubscription_ = device
      .observeOpenedOrNot()
      .pipe(
        switchMap((opened) => {
          if (opened) {
            return interval(50)
          } else {
            return EMPTY
          }
        }),
        sampleTime(50), // 50ms 샘플링
        takeUntil(this.closeTrigger()),
      )
      .subscribe(() => {
        if (stateHolder.writing) {
          this.log(ctx).i(logTag, 'already writing')
          return
        }
        if (!device.isOpened()) {
          this.log(ctx).i(logTag, 'not opened')
          stateHolder.writing = false
          return
        }
        stateHolder.writing = true
        this.tx_d[5] = output.STR
        this.tx_d[7] = output.RM_H
        this.tx_d[8] = output.RM_L
        this.tx_d[10] = output.LM_H
        this.tx_d[11] = output.LM_L
        this.tx_d[12] = output.DMC
        this.tx_d[13] = output.DM1
        this.tx_d[14] = output.DM2
        this.tx_d[15] = output.DM3
        this.tx_d[16] = output.DM4
        this.tx_d[17] = output.DM5
        this.tx_d[18] = output.DM6
        this.tx_d[19] = output.DM7
        this.tx_d[20] = output.DM8
        this.tx_d[21] = output.IRO_BREAK
        this.tx_d[22] = output.BZR
        this.tx_d[23] = output.LED

        let checksum = 0
        for (let i = 1; i < 28; i++) {
          if (i != 2) {
            checksum += this.tx_d[i]
          }
        }
        this.tx_d[2] = checksum
        if (TRACE) this.log(ctx).i('TX', this.tx_d)
        device
          .write(this.tx_d)
          .catch((err) => {
            this.log(ctx).w(logTag, `write fail: ${err.message}`)
            stateHolder.writing = false
          })
          .then((success) => {
            stateHolder.writing = false
            if (TRACE) this.log(ctx).i(logTag, `TX FINISHED ${success ? 'success' : 'fail'}`)
          })
      })
  }

  private rxLoop_ = (ctx: any) => {
    const logTag = 'SaeonAlControl.rxLoop_()'
    this.log(ctx).i(logTag, 'start')

    const device = this.device_(ctx)
    this.rxSubscription_ = device
      .observeOpenedOrNot()
      .pipe(
        switchMap((opened) => {
          if (opened) {
            return device.observeReceivedData()
          } else {
            return EMPTY
          }
        }),
        sampleTime(200), // 200ms 샘플링
        map((it) => it.dataBuffer),
        takeUntil(this.closeTrigger()),
      )
      .subscribe((buf) => {
        if (this.stopped$.value) {
          if (TRACE) this.log(ctx).i(logTag, 'stopped')
          return
        }

        if (buf.byteLength >= 56) {
          if (buf[0] == 0x02 && buf[55] == 0x03) {
            sensors.IR1 = this.getBitMergeReuslt(buf[7], buf[8])
            sensors.IR2 = this.getBitMergeReuslt(buf[9], buf[10])
            sensors.IR3 = this.getBitMergeReuslt(buf[11], buf[12])
            sensors.IR4 = this.getBitMergeReuslt(buf[13], buf[14])
            sensors.IR5 = this.getBitMergeReuslt(buf[15], buf[16])
            sensors.IR6 = this.getBitMergeReuslt(buf[17], buf[18])

            sensors.LMC = this.getBitMergeReuslt(buf[19], buf[20])
            sensors.RMC = this.getBitMergeReuslt(buf[21], buf[22])
            sensors.STC = this.getBitMergeReuslt(buf[23], buf[24])

            sensors.TEMP = this.GetTemperatureValueByADC(this.getBitMergeReuslt(buf[49], buf[50]))
            sensors.CDS = this.getBitMergeReuslt(buf[43], buf[44])

            sensors.ACC_X = this.getBitMergeResultItSigned_12Bit(buf[25], buf[26])
            sensors.ACC_Y = this.getBitMergeResultItSigned_12Bit(buf[27], buf[28])
            sensors.ACC_Z = this.getBitMergeResultItSigned_12Bit(buf[29], buf[30])

            sensors.MAG_X = this.GetBitMergeResultSigned_16Bit(buf[31], buf[32])
            sensors.MAG_Y = this.GetBitMergeResultSigned_16Bit(buf[33], buf[34])
            sensors.MAG_Z = this.GetBitMergeResultSigned_16Bit(buf[35], buf[36])

            sensors.BAT = this.GetBatteryValueByADC(this.getBitMergeReuslt(buf[47], buf[48]))

            sensors.GYR_X = this.GetBitMergeResultSigned_16Bit(buf[37], buf[38])
            sensors.GYR_Y = this.GetBitMergeResultSigned_16Bit(buf[39], buf[40])
            sensors.GYR_Z = this.GetBitMergeResultSigned_16Bit(buf[41], buf[42])

            if (TRACE) this.log(ctx).i(logTag + ' accept:', JSON.stringify(sensors))
          } else {
            this.log(ctx).w(logTag, `invalid buf value(buf[0]=${buf[0]}, buf[21]=${buf[21]}`)
          }
        } else {
          this.log(ctx).w(logTag, `invalid buf.byteLength(${buf.byteLength} byte`)
        }
      })
  }

  private getBitMergeReuslt(byH: any, byL: any) {
    let nTempH = byH
    const nTempL = byL

    nTempH = (nTempH << 8) | byL

    return nTempH
  }

  private getBitMergeResultItSigned_12Bit(byH: any, byL: any) {
    let nTempH = byH
    const nTempL = byL

    nTempH = (nTempH << 8) | byL

    if ((nTempH & 0x8000) == 0x8000) {
      nTempH = ~(nTempH - 1)
      nTempH = 0 - (nTempH & 0xffff)
    } else {
      nTempH &= 0x7fff
    }
    return (nTempH = nTempH >> 4)
  }

  private GetBitMergeResultSigned_16Bit(byH: any, byL: any) {
    let nTempH = byH
    const nTempL = byL

    nTempH = (nTempH << 8) | byL

    if ((nTempH & 0x8000) == 0x8000) {
      nTempH = ~(nTempH - 1)
      nTempH = 0 - (nTempH & 0xffff)
    } else {
      nTempH &= 0x7fff
    }
    return nTempH
  }

  private GetTemperatureValueByADC(adcVal: number) {
    const k3 = (5.0 / 1024) * adcVal
    const k2 = (10 * k3) / (5 - k3)
    const k = 0.0009 * (k2 * k2 * k2 * k2) - 0.0622 * (k2 * k2 * k2) + (1.5411 * k2 * k2 - 18.05 * k2 + 103.61)

    return Math.round(k)
  }

  private GetBatteryValueByADC(adcVal: number) {
    const voltage = 0.0027 * adcVal + 5.8958
    if (voltage < 7) return 0
    if (voltage > 8.3) return 100
    let per = ((voltage - 7) / (8.3 - 7)) * 100
    if (per < 0) per = 0
    if (per > 100) per = 100
    return Math.round(per)
  }

  async stop(ctx: any, option: string): Promise<void> {
    console.log('stop')
    if (option == 'All') {
      output.STR = 0
      output.RM_H = 0
      output.RM_L = 0
      output.LM_H = 0
      output.LM_L = 0
      output.DMC = 0
      output.DM1 = 0
      output.DM2 = 0
      output.DM3 = 0
      output.DM4 = 0
      output.DM5 = 0
      output.DM6 = 0
      output.DM7 = 0
      output.DM8 = 0
      output.IRO_BREAK &= 0x0f
      output.BZR = 0
      output.LED = 0
    } else if (option == 'Drive') {
      output.RM_H = 0
      output.RM_L = 0
      output.LM_H = 0
      output.LM_L = 0
    } else if (option == 'Steering') {
      output.STR = 0
    } else if (option == 'Sound') {
      output.BZR = 0
    } else if (option == 'Light') {
      output.LED = 0
      output.IRO_BREAK &= 0x0a
    } else if (option == 'Display') {
      output.DMC = 0
      output.DM1 = 0
      output.DM2 = 0
      output.DM3 = 0
      output.DM4 = 0
      output.DM5 = 0
      output.DM6 = 0
      output.DM7 = 0
      output.DM8 = 0
    }
  }

  async go(ctx: any, lp: number, rp: number): Promise<void> {
    let tempLeft = 0
    let tempRight = 0

    let dirLeft = false
    let dirRight = false

    if (rp < 0) {
      dirRight = false
    } else if (rp > 0) {
      dirRight = true
    }

    if (lp < 0) {
      dirLeft = false
    } else if (lp > 0) {
      dirLeft = true
    }

    tempLeft = Math.abs(lp)
    tempRight = Math.abs(rp)

    if (tempLeft > 1000) tempLeft = 1000
    if (tempRight > 1000) tempRight = 1000

    if (dirRight) {
      output.RM_H = (tempRight >> 8) & 0xff
    } else {
      output.RM_H = ((tempRight >> 8) & 0xff) | 0x80
    }
    output.RM_L = tempRight & 0xff

    if (dirLeft) {
      output.LM_H = (tempLeft >> 8) & 0xff
    } else {
      output.LM_H = ((tempLeft >> 8) & 0xff) | 0x80
    }
    output.LM_L = tempLeft & 0xff

    console.log('go lp : ' + lp + ' rp : ' + rp)
  }

  async steering(ctx: any, option: string): Promise<void> {
    let strDir = ''
    let strAngle = ''

    if (option.indexOf('-') != -1) {
      const strTempBuf = option.split('-')
      strDir = strTempBuf[0]
      strAngle = strTempBuf[1]
    } else {
      if (option.indexOf('Center') != -1) {
        strAngle = '0'
        strDir = 'Center'
      } else {
        return
      }
    }

    let nTemp = 0
    try {
      nTemp = parseInt(strAngle)
    } catch {
      return
    }

    nTemp = nTemp * 6

    if (nTemp > 128) nTemp = 128
    else if (nTemp < 0) nTemp = 0

    if (strDir.indexOf('Left') != -1) {
      output.STR = nTemp | 0x80
    } else if (strDir.indexOf('Right') != -1) {
      output.STR = nTemp
    } else if (strDir.indexOf('Center') != -1) {
      output.STR = nTemp
    } else return

    console.log('steering')
  }

  async steeringNumber(ctx: any, val: number): Promise<void> {
    let dir = 0
    let temp = 0

    if (val < 0) dir = 1 // left
    else if (val > 0) dir = 2 // right

    temp = Math.abs(val)

    if (temp > 127) temp = 127

    if (dir == 1) {
      output.STR = temp | 0x80
    } else if (dir == 2) {
      output.STR = temp
    } else {
      output.STR = 0
    }

    console.log('steeringNumber')
  }

  async sensor(ctx: any, option: string): Promise<number> {
    console.log('sensor')
    if (option == 'CDS') return sensors.CDS
    if (option == 'IR1') return sensors.IR1
    if (option == 'IR2') return sensors.IR2
    if (option == 'IR3') return sensors.IR3
    if (option == 'IR4') return sensors.IR4
    if (option == 'IR5') return sensors.IR5
    if (option == 'IR6') return sensors.IR6
    if (option == 'ACC_X') return sensors.ACC_X
    if (option == 'ACC_Y') return sensors.ACC_Y
    if (option == 'ACC_Z') return sensors.ACC_Z
    if (option == 'MAG_X') return sensors.MAG_X
    if (option == 'MAG_Y') return sensors.MAG_Y
    if (option == 'MAG_Z') return sensors.MAG_Z
    if (option == 'GYR_X') return sensors.GYR_X
    if (option == 'GYR_Y') return sensors.GYR_Y
    if (option == 'GYR_Z') return sensors.GYR_Z
    if (option == 'TEMP') return sensors.TEMP
    if (option == 'LMC') return sensors.LMC
    if (option == 'RMC') return sensors.RMC
    if (option == 'STC') return sensors.STC
    if (option == 'BAT') return sensors.BAT
    return 0
  }

  async light(ctx: any, fn: string, state: string): Promise<void> {
    if (state == 'On') {
      if (fn == 'Forward') {
        output.LED |= 0x01
        output.LED |= 0x02
      } else if (fn == 'Brake') {
        output.IRO_BREAK |= 0x80
        output.IRO_BREAK |= 0x40
      } else if (fn == 'Turn left') {
        output.LED |= 0x20
        output.LED |= 0x80
      } else if (fn == 'Turn right') {
        output.LED |= 0x40
        output.LED |= 0x10
      } else if (fn == 'Reverse') {
        output.LED |= 0x04
        output.LED |= 0x08
      }
    } else if (state == 'Off') {
      if (fn == 'Forward') {
        output.LED &= 0xfe
        output.LED &= 0xfd
      } else if (fn == 'Brake') {
        output.IRO_BREAK &= 0x7f
        output.IRO_BREAK &= 0xbf
      } else if (fn == 'Turn left') {
        output.LED &= 0xdf
        output.LED &= 0x7f
      } else if (fn == 'Turn right') {
        output.LED &= 0xbf
        output.LED &= 0xef
      } else if (fn == 'Reverse') {
        output.LED &= 0xfb
        output.LED &= 0xf7
      }
    }
    console.log('light')
  }

  async lightHex(ctx: any, breakHex: number, ledHex: number): Promise<void> {
    output.IRO_BREAK &= 0x0f
    output.IRO_BREAK |= breakHex & 0xf0
    output.LED = ledHex & 0xff
    console.log('lightHex : ' + breakHex + ':' + ledHex)
  }

  async sound(ctx: any, oct: string, scale: string): Promise<void> {
    let nOct = 0
    let nScale = 0

    if (oct == '1-Oct') nOct = 1
    else if (oct == '2-Oct') nOct = 2
    else if (oct == '3-Oct') nOct = 3
    else if (oct == '4-Oct') nOct = 4
    else if (oct == '5-Oct') nOct = 5
    else if (oct == '6-Oct') nOct = 6
    else if (oct == '7-Oct') nOct = 7
    else if (oct == '8-Oct') nOct = 8
    else return

    if (scale == 'C (Do)') nScale = 1
    else if (scale == 'C# (Do#)') nScale = 2
    else if (scale == 'D (Re)') nScale = 3
    else if (scale == 'D# (Re#)') nScale = 4
    else if (scale == 'E (Mi)') nScale = 5
    else if (scale == 'F (Fa)') nScale = 6
    else if (scale == 'F# (Fa#)') nScale = 7
    else if (scale == 'G (Sol)') nScale = 8
    else if (scale == 'G# (Sol#)') nScale = 9
    else if (scale == 'A (La)') nScale = 10
    else if (scale == 'A# (La#)') nScale = 11
    else if (scale == 'B (Si)') nScale = 12
    else if (scale == 'Non') nScale = 0
    else return

    if (nScale == 0) output.BZR = 0
    else output.BZR = (nOct - 1) * 12 + nScale

    console.log('sound')
  }

  async soundNumber(ctx: any, scale: number): Promise<void> {
    if (scale > 96) return
    if (scale < 0) return
    output.BZR = scale
    console.log('soundNumber')
  }

  async displayChar(ctx: any, ch: string): Promise<void> {
    //if (ch.length > 1) return
    if (ch.length < 1) return
    ch = ch.replace(/“ /g, '')
    ch = ch.replace(/ ”/g, '')

    // this.tx_d[12] = ch.charCodeAt(0) | 0x80
    output.DMC = ch.charCodeAt(0) | 0x80
    console.log('displayChar : ' + ch.charCodeAt(0))
    console.log(typeof ch)
  }

  async displayLine(
    ctx: any,
    line: string,
    bit0: string,
    bit1: string,
    bit2: string,
    bit3: string,
    bit4: string,
    bit5: string,
    bit6: string,
    bit7: string,
  ): Promise<void> {
    let lineMask = 0

    output.DMC = 0

    if (line == 'Line-1') lineMask = 0x01
    else if (line == 'Line-2') lineMask = 0x02
    else if (line == 'Line-3') lineMask = 0x04
    else if (line == 'Line-4') lineMask = 0x08
    else if (line == 'Line-5') lineMask = 0x10
    else if (line == 'Line-6') lineMask = 0x20
    else if (line == 'Line-7') lineMask = 0x40
    else if (line == 'Line-8') lineMask = 0x80
    else return

    if (bit0 == 'On') output.DM8 |= lineMask
    else if (bit0 == 'Off') output.DM8 &= ~lineMask
    else return
    if (bit1 == 'On') output.DM7 |= lineMask
    else if (bit1 == 'Off') output.DM7 &= ~lineMask
    else return
    if (bit2 == 'On') output.DM6 |= lineMask
    else if (bit2 == 'Off') output.DM6 &= ~lineMask
    else return
    if (bit3 == 'On') output.DM5 |= lineMask
    else if (bit3 == 'Off') output.DM5 &= ~lineMask
    else return
    if (bit4 == 'On') output.DM4 |= lineMask
    else if (bit4 == 'Off') output.DM4 &= ~lineMask
    else return
    if (bit5 == 'On') output.DM3 |= lineMask
    else if (bit5 == 'Off') output.DM3 &= ~lineMask
    else return
    if (bit6 == 'On') output.DM2 |= lineMask
    else if (bit6 == 'Off') output.DM2 &= ~lineMask
    else return
    if (bit7 == 'On') output.DM1 |= lineMask
    else if (bit7 == 'Off') output.DM1 &= ~lineMask
    else return

    console.log('displayLine')
  }

  async display(
    ctx: any,
    line1: number,
    line2: number,
    line3: number,
    line4: number,
    line5: number,
    line6: number,
    line7: number,
    line8: number,
  ): Promise<void> {
    const strBuf = [line1, line2, line3, line4, line5, line6, line7, line8]

    output.DMC = 0

    for (let i = 0; i < 8; i++) {
      if (i == 0) output.DM8 = strBuf[i]
      else if (i == 1) output.DM7 = strBuf[i]
      else if (i == 2) output.DM6 = strBuf[i]
      else if (i == 3) output.DM5 = strBuf[i]
      else if (i == 4) output.DM4 = strBuf[i]
      else if (i == 5) output.DM3 = strBuf[i]
      else if (i == 6) output.DM2 = strBuf[i]
      else if (i == 7) output.DM1 = strBuf[i]
      else return
    }
  }

  async display_on(ctx: any, x: number, y: number): Promise<void> {
    if (x > 8) return
    if (x < 1) return
    if (y > 8) return
    if (y < 1) return

    const nX = x - 1
    const nY = y - 1

    // disable ascii mode
    output.DMC = 0

    let mask = 0x01
    mask = mask << nY

    if (nX == 7) output.DM1 |= mask
    if (nX == 6) output.DM2 |= mask
    if (nX == 5) output.DM3 |= mask
    if (nX == 4) output.DM4 |= mask
    if (nX == 3) output.DM5 |= mask
    if (nX == 2) output.DM6 |= mask
    if (nX == 1) output.DM7 |= mask
    if (nX == 0) output.DM8 |= mask

    console.log('display_on')
  }

  async display_off(ctx: any, x: number, y: number): Promise<void> {
    if (x > 8) return
    if (x < 1) return
    if (y > 8) return
    if (y < 1) return

    const nX = x - 1
    const nY = y - 1

    // disable ascii mode
    this.tx_d[12] = 0

    let mask = 0x01
    mask = mask << nY

    if (nX == 7) output.DM1 &= ~mask
    if (nX == 6) output.DM2 &= ~mask
    if (nX == 5) output.DM3 &= ~mask
    if (nX == 4) output.DM4 &= ~mask
    if (nX == 3) output.DM5 &= ~mask
    if (nX == 2) output.DM6 &= ~mask
    if (nX == 1) output.DM7 &= ~mask
    if (nX == 0) output.DM8 &= ~mask

    console.log('display_off')
  }

  /**
   * 디바이스(serial)에 연결된 직후에 자동으로 호출됩니다
   */
  onDeviceOpened = async (ctx: any): Promise<void> => {
    const logTag = 'SaeonAlControl.onDeviceOpened()'
    this.log(ctx).i(logTag, 'called')
    this.rxLoop_(ctx)
    this.txLoop_(ctx)
  }

  /**
   * 디바이스(serial)가 닫히기 전에 자동으로 호출됩니다
   */
  onDeviceWillClose = async (ctx: any): Promise<void> => {
    const logTag = 'SaeonAlControl.onDeviceWillClose()'
    this.log(ctx).i(logTag, 'called')
    this.stopped$.next(true)

    if (this.rxSubscription_) {
      this.log(ctx).i(logTag, 'rxLoop stop')
      this.rxSubscription_.unsubscribe()
      this.rxSubscription_ = undefined
    } else {
      this.log(ctx).i(logTag, 'rxLoop already stopped')
    }

    if (this.txSubscription_) {
      this.log(ctx).i(logTag, 'txLoop stop')
      this.txSubscription_.unsubscribe()
      this.txSubscription_ = undefined
    } else {
      this.log(ctx).i(logTag, 'txLoop already stopped')
    }
  }

  onWebSocketConnected = async (ctx: any): Promise<void> => {
    const logTag = 'SaeonAlControl.onWebSocketConnected()'
    this.log(ctx).i(logTag, 'called')
  }

  onWebSocketDisconnected = async (ctx: any): Promise<void> => {
    const logTag = 'SaeonAlControl.onWebSocketDisconnected()'
    this.log(ctx).i(logTag, 'called')

    try {
      await this.stop(ctx, 'All')
    } catch (err) {}
  }
}
