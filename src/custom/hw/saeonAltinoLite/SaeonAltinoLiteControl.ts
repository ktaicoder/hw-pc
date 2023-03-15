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
import { ISaeonAltinoLiteControl } from './ISaeonAltinoLiteControl'

const TRACE = false

const sensors = {
  CDS: 0,
  IR1: 0,
  IR2: 0,
  IR3: 0,
  IR4: 0,
  IR5: 0,
  IR6: 0,
  BAT: 0,
}

const output = {
  RM: 0,
  LM: 0,
  STR: 0,
  LED: 0,
  NOTE: 0,
  CHAR: 0,
  DM1: 0,
  DM2: 0,
  DM3: 0,
  DM4: 0,
  DM5: 0,
  DM6: 0,
  DM7: 0,
  DM8: 0,
}

export class SaeonAltinoLiteControl extends AbstractHwConrtol implements ISaeonAltinoLiteControl {
  private tx_d: Array<number> = [0x02, 16, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x03]
  private rx_d: Array<number> = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

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
    const logTag = 'SaeonAltinoLiteControl.txLoop_()'
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
        this.tx_d[6] = (output.RM & 0xff00) >> 8
        this.tx_d[7] = output.RM & 0xff
        this.tx_d[8] = (output.LM & 0xff00) >> 8
        this.tx_d[9] = output.LM & 0xff
        this.tx_d[10] = output.CHAR
        this.tx_d[11] = output.DM1
        this.tx_d[12] = output.DM2
        this.tx_d[13] = output.DM3
        this.tx_d[14] = output.DM4
        this.tx_d[15] = output.DM5
        this.tx_d[16] = output.DM6
        this.tx_d[17] = output.DM7
        this.tx_d[18] = output.DM8
        this.tx_d[19] = output.NOTE
        this.tx_d[20] = output.LED

        let checksum = 0
        for (let i = 3; i < 21; i++) {
          checksum += this.tx_d[i]
        }
        this.tx_d[2] = checksum & 0xff
        if (TRACE) this.log(ctx).i('TX', this.tx_d)
        device
          .write(this.tx_d)
          .catch((err) => {
            this.log(ctx).w(logTag, `write fail: ${err.message}`)
          })
          .finally(() => {
            stateHolder.writing = false
          })
      })
  }

  private rxLoop_ = (ctx: any) => {
    const logTag = 'SaeonAltinoLiteControl.rxLoop_()'
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
        sampleTime(50), // 50ms 샘플링
        map((it) => it.dataBuffer),
        takeUntil(this.closeTrigger()),
      )
      .subscribe((buf) => {
        if (this.stopped$.value) {
          if (TRACE) this.log(ctx).i(logTag, 'stopped')
          return
        }
        if (buf.byteLength >= 22) {
          if (buf[0] == 0x02 && buf[21] == 0x03) {
            sensors.IR1 = buf[5] * 256 + buf[6]
            sensors.IR2 = buf[7] * 256 + buf[8]
            sensors.IR3 = buf[9] * 256 + buf[10]
            sensors.IR4 = buf[11] * 256 + buf[12]
            sensors.IR5 = buf[13] * 256 + buf[14]
            sensors.IR6 = buf[15] * 256 + buf[16]
            sensors.CDS = buf[17] * 256 + buf[18]
            sensors.BAT = buf[19] * 256 + buf[20]
            if (TRACE) this.log(ctx).i(logTag + ' accept:', JSON.stringify(sensors))
          } else {
            this.log(ctx).w(logTag, `invalid buf value(buf[0]=${buf[0]}, buf[21]=${buf[21]}`)
          }
        } else {
          this.log(ctx).w(logTag, `invalid buf.byteLength(${buf.byteLength} byte`)
        }
      })
  }

  async stop(ctx: any, option: string): Promise<void> {
    console.log('stop')
    if (option == 'All') {
      output.RM = 0
      output.LM = 0
      output.STR = 0
      output.LED = 0
      output.NOTE = 0
      output.CHAR = 0
      output.DM1 = 0
      output.DM2 = 0
      output.DM3 = 0
      output.DM4 = 0
      output.DM5 = 0
      output.DM6 = 0
      output.DM7 = 0
      output.DM8 = 0
    } else if (option == 'Drive') {
      output.RM = 0
      output.LM = 0
    } else if (option == 'Steering') {
      output.STR = 0
    } else if (option == 'Sound') {
      output.NOTE = 0
    } else if (option == 'Light') {
      output.LED = 0
    } else if (option == 'Display') {
      output.CHAR = 0
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
    output.RM = rp
    output.LM = lp
    console.log('go')
  }

  async steering(ctx: any, option: string): Promise<void> {
    if (option == 'Center') {
      output.STR = 0
    } else if (option == 'Left-5') {
      output.STR = -31
    } else if (option == 'Left-10') {
      output.STR = -63
    } else if (option == 'Left-15') {
      output.STR = -95
    } else if (option == 'Left-20') {
      output.STR = -127
    } else if (option == 'Right-5') {
      output.STR = 31
    } else if (option == 'Right-10') {
      output.STR = 63
    } else if (option == 'Right-15') {
      output.STR = 95
    } else if (option == 'Right-20') {
      output.STR = 127
    }
    console.log('steering')
  }

  async steeringNumber(ctx: any, val: number): Promise<void> {
    output.STR = val
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
    if (option == 'BAT') return sensors.BAT
    return 0
  }

  async light(ctx: any, fn: string, state: string): Promise<void> {
    if (state == 'On') {
      if (fn == 'Forward') {
        output.LED |= 0x01
      } else if (fn == 'Brake') {
        output.LED |= 0x02
      } else if (fn == 'Turn left') {
        output.LED |= 0x04
      } else if (fn == 'Turn right') {
        output.LED |= 0x08
      }
    } else if (state == 'Off') {
      if (fn == 'Forward') {
        output.LED &= 0xfe
      } else if (fn == 'Brake') {
        output.LED &= 0xfd
      } else if (fn == 'Turn left') {
        output.LED &= 0xfb
      } else if (fn == 'Turn right') {
        output.LED &= 0xf7
      }
    }
    console.log('light')
  }

  async lightHex(ctx: any, hex: string): Promise<void> {
    if (hex.indexOf('0x') == 0) {
      const hexString = hex.replace('0x', '')
      output.LED = parseInt(hexString, 16)
    }
    console.log('lightHex')
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

    if (nScale == 0) output.NOTE = 0
    else output.NOTE = (nOct - 1) * 12 + nScale

    console.log('sound')
  }

  async soundNumber(ctx: any, scale: number): Promise<void> {
    if (scale > 255) return
    if (scale < 0) return
    output.NOTE = scale
    console.log('soundNumber')
  }

  async displayChar(ctx: any, ch: string): Promise<void> {
    if (ch.length > 1) return
    if (ch.length < 1) return
    output.CHAR = ch.charCodeAt(0)
    console.log('displayChar')
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
    const nTemp = 0

    // disable ascii mode
    output.CHAR = 0xff

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
    line1: string,
    line2: string,
    line3: string,
    line4: string,
    line5: string,
    line6: string,
    line7: string,
    line8: string,
  ): Promise<void> {
    // disable ascii mode
    output.CHAR = 0xff

    if (line1.indexOf('0x') != 0) return
    if (line2.indexOf('0x') != 0) return
    if (line3.indexOf('0x') != 0) return
    if (line4.indexOf('0x') != 0) return
    if (line5.indexOf('0x') != 0) return
    if (line6.indexOf('0x') != 0) return
    if (line7.indexOf('0x') != 0) return
    if (line8.indexOf('0x') != 0) return

    const lines = [
      parseInt(line8.replace('0x', ''), 16),
      parseInt(line7.replace('0x', ''), 16),
      parseInt(line6.replace('0x', ''), 16),
      parseInt(line5.replace('0x', ''), 16),
      parseInt(line4.replace('0x', ''), 16),
      parseInt(line3.replace('0x', ''), 16),
      parseInt(line2.replace('0x', ''), 16),
      parseInt(line1.replace('0x', ''), 16),
    ]

    for (let i = 0; i < 8; i++) {
      const str = ['Off', 'Off', 'Off', 'Off', 'Off', 'Off', 'Off', 'Off']
      if (lines[i] & 0x80) str[0] = 'On'
      if (lines[i] & 0x40) str[1] = 'On'
      if (lines[i] & 0x20) str[2] = 'On'
      if (lines[i] & 0x10) str[3] = 'On'
      if (lines[i] & 0x08) str[4] = 'On'
      if (lines[i] & 0x04) str[5] = 'On'
      if (lines[i] & 0x02) str[6] = 'On'
      if (lines[i] & 0x01) str[7] = 'On'
      this.displayLine(ctx, 'Line-' + (i + 1), str[0], str[1], str[2], str[3], str[4], str[5], str[6], str[7])
    }

    console.log('display')
  }

  async display_on(ctx: any, x: number, y: number): Promise<void> {
    if (x > 8) return
    if (x < 1) return
    if (y > 8) return
    if (y < 1) return

    const nX = x - 1
    const nY = y - 1

    // disable ascii mode
    output.CHAR = 0xff

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
    if (x > 7) return
    if (x < 0) return
    if (y > 7) return
    if (y < 0) return

    const nX = x - 1
    const nY = y - 1

    // disable ascii mode
    output.CHAR = 0xff

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
    const logTag = 'SaeonAltinoLiteControl.onDeviceOpened()'
    this.log(ctx).i(logTag, 'called')
    this.rxLoop_(ctx)
    this.txLoop_(ctx)
  }

  /**
   * 디바이스(serial)가 닫히기 전에 자동으로 호출됩니다
   */
  onDeviceWillClose = async (ctx: any): Promise<void> => {
    const logTag = 'SaeonAltinoLiteControl.onDeviceWillClose()'
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
    const logTag = 'SaeonAltinoLiteControl.onWebSocketConnected()'
    this.log(ctx).i(logTag, 'called')
  }

  onWebSocketDisconnected = async (ctx: any): Promise<void> => {
    const logTag = 'SaeonAltinoLiteControl.onWebSocketDisconnected()'
    this.log(ctx).i(logTag, 'called')

    try {
      await this.stop(ctx, 'All')
    } catch (err) {}
  }
}
