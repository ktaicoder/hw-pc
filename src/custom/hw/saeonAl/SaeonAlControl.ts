import {
  BehaviorSubject,
  distinctUntilChanged,
  EMPTY,
  exhaustMap,
  filter,
  from,
  interval,
  Observable,
  sampleTime,
  Subscription,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs'
import { uiLogger } from 'src/services/hw/UiLogger'
import { AbstractHwConrtol } from '../AbstractHwControl'
import { atMost, clamp, createNumberArray, sleepAsync } from '../util'
import { ISaeonAlControl } from './ISaeonAlControl'
import { AlOutput, LINE_MASKS, NOTE_OCT, NOTE_SCALE } from './saeon-al-utils'

const TRACE = false
const DEBUG = true
const TX_INTERVAL = 50
const RX_INTERVAL = 50

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

const output = new AlOutput()

function createDefaultTxBytes(): number[] {
  return createNumberArray(28, (arr) => {
    arr[0] = 2
    arr[1] = 28
    arr[4] = 10
    arr[21] = 10
    arr[24] = 1
    arr[26] = 0xff
    arr[27] = 3
  })
}

export class SaeonAlControl extends AbstractHwConrtol implements ISaeonAlControl {
  private txBytes = createDefaultTxBytes()

  private rxSubscription_: Subscription | undefined

  private txSubscription_: Subscription | undefined

  private stopped$ = new BehaviorSubject(false)

  private forceStopping_ = false

  private closeTrigger = (): Observable<any> => {
    return this.stopped$.pipe(
      filter((it) => it === true),
      take(1),
    )
  }

  async stop(ctx: any, option: string): Promise<void> {
    console.log(`stop(${option})`)
    if (option == 'All') {
      output.updateForStopAll()
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
    console.log(`go(${lp}, ${rp})`)
    const dirLeft = lp > 0
    const dirRight = rp > 0
    const tempLeft = atMost(Math.abs(lp), 1000)
    const tempRight = atMost(Math.abs(rp), 1000)

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
  }

  async steering(ctx: any, option: string): Promise<void> {
    console.log(`steering(${option})`)
    try {
      const idx = option.indexOf('-')
      if (option.startsWith('Left-')) {
        const amount = parseInt(option.slice(idx + 1))
        output.STR = clamp(amount * 6, 0, 127) | 0x80
        return
      }
      if (option.startsWith('Right-')) {
        const amount = parseInt(option.slice(idx + 1))
        output.STR = clamp(amount * 6, 0, 127)
        return
      }
      if (option === 'Center') {
        output.STR = 0
        return
      }
    } catch (err) {
      // ignore
    }
    console.log(`steering() invalid option: ${option}`)
  }

  async steeringNumber(ctx: any, value: number): Promise<void> {
    console.log(`steeringNumber(${value})`)
    const valueAbs = atMost(Math.abs(value), 127)
    if (value < 0) {
      output.STR = valueAbs | 0x80
    } else if (value > 0) {
      output.STR = valueAbs
    } else {
      output.STR = 0
    }
  }

  async sensor(ctx: any, option: string): Promise<number> {
    console.log(`sensor(${option})`)
    const value = sensors[option]
    if (typeof value === 'undefined') {
      console.log('sensor() invalid option:', option)
      return 0
    }
    return value
  }

  async light(ctx: any, fn: string, state: string): Promise<void> {
    console.log(`light(${fn}, ${state})`)
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
  }

  async lightHex(ctx: any, breakHex: number, ledHex: number): Promise<void> {
    console.log(`lightHex(${breakHex}, ${ledHex})`)
    output.IRO_BREAK &= 0x0f
    output.IRO_BREAK |= breakHex & 0xf0
    output.LED = ledHex & 0xff
  }

  async sound(ctx: any, oct: string, scale: string): Promise<void> {
    console.log(`sound(${oct}, ${scale})`)
    const nOct = NOTE_OCT[oct]
    if (typeof nOct === 'undefined') {
      console.log(`sound() invalid oct: ${oct}`)
      return
    }

    const nScale = NOTE_SCALE[scale]
    if (typeof nScale === 'undefined') {
      console.log(`sound() invalid oct: ${scale}`)
      return
    }

    output.BZR = nScale == 0 ? 0 : (nOct - 1) * 12 + nScale
    console.log('sound')
  }

  async soundNumber(ctx: any, scale: number): Promise<void> {
    console.log(`soundNumber(${scale})`)
    if (scale < 0 || scale > 96) {
      console.log(`soundNumber() invalid scale:${scale}`)
      return
    }
    output.BZR = scale
  }

  async displayChar(ctx: any, ch: string): Promise<void> {
    console.log(`displayChar(${ch})`)
    if (ch.length < 1) {
      console.log(`displayChar() invalid ch:${ch}`)
      return
    }

    const character = ch.replace(/“ | ”/g, '')
    if (character.length === 0) {
      console.log('displayChar() ch is empty:' + ch)
      return
    }

    output.DMC = ch.charCodeAt(0) | 0x80
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
    console.log(
      `displayLine(${line}, ${bit0}, ${bit1}, ${bit2}, ${bit3}, ${bit4}, ${bit5}, ${bit6}, ${bit7})`,
    )

    output.DMC = 0
    const lineMask = LINE_MASKS[line]
    if (typeof lineMask !== 'number') {
      console.log(`displayLine() invalid line:${line}`)
      return
    }

    const maskFn = (dmValue: number, bit: string) => {
      if (bit === 'On') return dmValue | lineMask
      if (bit === 'Off') return dmValue & ~lineMask
      console.log(`displayLine() invalid bit:${bit}`)
      return null
    }

    const bits = [bit0, bit1, bit2, bit3, bit4, bit5, bit6, bit7]
    const dmKeys = ['DM8', 'DM7', 'DM6', 'DM5', 'DM4', 'DM3', 'DM2', 'DM1']

    bits.forEach((bit, i) => {
      const dmKey = dmKeys[i]
      const v = maskFn(output[dmKey], bit)
      if (v == null) return
      output[dmKey] = v
    })
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
    console.log(
      `display(${line1}, ${line2}, ${line3}, ${line4}, ${line5}, ${line6}, ${line7}, ${line8})`,
    )
    output.DMC = 0
    output.DM8 = line1
    output.DM7 = line2
    output.DM6 = line3
    output.DM5 = line4
    output.DM4 = line5
    output.DM3 = line6
    output.DM2 = line7
    output.DM1 = line8
  }

  async display_on(ctx: any, x: number, y: number): Promise<void> {
    console.log(`display_on(${x}, ${y})`)
    if (x < 1 || x > 8) {
      console.log(`display_on() invalid x:${x}`)
      return
    }

    if (y < 1 || y > 8) {
      console.log(`display_on() invalid y:${y}`)
      return
    }

    output.DMC = 0 // disable ascii mode

    const nX = x - 1
    const nY = y - 1
    const mask = 0x01 << nY

    if (nX == 7) output.DM1 |= mask
    if (nX == 6) output.DM2 |= mask
    if (nX == 5) output.DM3 |= mask
    if (nX == 4) output.DM4 |= mask
    if (nX == 3) output.DM5 |= mask
    if (nX == 2) output.DM6 |= mask
    if (nX == 1) output.DM7 |= mask
    if (nX == 0) output.DM8 |= mask
  }

  async display_off(ctx: any, x: number, y: number): Promise<void> {
    console.log(`display_off(${x}, ${y})`)
    if (x < 1 || x > 8) {
      console.log(`display_off() invalid x:${x}`)
      return
    }

    if (y < 1 || y > 8) {
      console.log(`display_off() invalid y:${y}`)
      return
    }

    const nX = x - 1
    const nY = y - 1
    const mask = 0x01 << nY

    // TODO check
    // disable ascii mode
    this.txBytes[12] = 0

    if (nX == 7) output.DM1 &= ~mask
    if (nX == 6) output.DM2 &= ~mask
    if (nX == 5) output.DM3 &= ~mask
    if (nX == 4) output.DM4 &= ~mask
    if (nX == 3) output.DM5 &= ~mask
    if (nX == 2) output.DM6 &= ~mask
    if (nX == 1) output.DM7 &= ~mask
    if (nX == 0) output.DM8 &= ~mask
  }

  /**
   * original name: getBitMergeReuslt
   */
  private makeUint16_(byH: any, byL: any) {
    const high = 0xff & byH
    const low = 0xff & byL
    return (high << 8) | low
  }

  /**
   * original name: getBitMergeResultItSigned_12Bit()
   */
  private makeSigned12Bit_(byH: any, byL: any) {
    let nTempH = (byH << 8) | byL
    if ((nTempH & 0x8000) == 0x8000) {
      nTempH = ~(nTempH - 1)
      nTempH = 0 - (nTempH & 0xffff)
    } else {
      nTempH &= 0x7fff
    }
    return nTempH >> 4
  }

  /**
   * original name: GetBitMergeResultSigned_16Bit()
   */
  private makeSigned16Bit_(byH: any, byL: any) {
    let nTempH = (byH << 8) | byL
    if ((nTempH & 0x8000) == 0x8000) {
      nTempH = ~(nTempH - 1)
      nTempH = 0 - (nTempH & 0xffff)
    } else {
      nTempH &= 0x7fff
    }
    return nTempH
  }

  /**
   * original name: GetTemperatureValueByADC()
   */
  private makeAdcTemp_(adcVal: number) {
    const k3 = (5.0 / 1024) * adcVal
    const k2 = (10 * k3) / (5 - k3)
    const k =
      0.0009 * (k2 * k2 * k2 * k2) -
      0.0622 * (k2 * k2 * k2) +
      (1.5411 * k2 * k2 - 18.05 * k2 + 103.61)

    return Math.round(k)
  }

  /**
   * original name: GetBatteryValueByADC()
   */
  private makeAdcBattery_(adcVal: number) {
    const voltage = 0.0027 * adcVal + 5.8958
    if (voltage < 7) return 0
    if (voltage > 8.3) return 100

    const per = ((voltage - 7) / (8.3 - 7)) * 100
    return Math.round(clamp(per, 0, 100))
  }

  /**
   * update checksums
   */
  private updateCksum_(array: number[]) {
    let cksum = 0
    for (let i = 1; i < 28; i++) {
      if (i !== 2) {
        cksum += array[i]
      }
    }
    array[2] = cksum
  }

  /**
   * Send values to the device
   */
  protected writeRaw_ = async (ctx: any, values: number[] | Buffer): Promise<void> => {
    await this.device_(ctx)?.write(values)
  }

  /**
   * force stop
   */
  private forceStopAll_ = async (ctx: any) => {
    const logTag = 'SaeonAlControl.forceStopAll_()'
    this.forceStopping_ = true
    try {
      for (let i = 0; i < 2; i++) {
        if (i > 0) await sleepAsync(TX_INTERVAL)

        // Update the output object to stop for the txLoop.
        output.updateForStopAll()

        const bytes = createDefaultTxBytes()
        this.updateCksum_(bytes)

        if (TRACE) console.log('TX', bytes)
        await this.writeRaw_(ctx, bytes).catch((err) => {
          console.info(logTag, `ignore, writeRaw_() write fail: ${err.message}`)
        })
      }
    } catch (err) {
      // ignore
    } finally {
      this.forceStopping_ = false
    }
  }

  /**
   * Write an output object to a device
   */
  private writeOutput_ = async (ctx: any, logTag: string): Promise<any> => {
    if (this.forceStopping_) return
    if (this.stopped$.value) {
      if (TRACE) console.log(logTag, 'stopped')
      return
    }

    const device = this.device_(ctx)
    if (!device.isOpened()) {
      console.log(logTag, 'not opened')
      return
    }

    this.txBytes[5] = output.STR
    this.txBytes[7] = output.RM_H
    this.txBytes[8] = output.RM_L
    this.txBytes[10] = output.LM_H
    this.txBytes[11] = output.LM_L
    this.txBytes[12] = output.DMC
    this.txBytes[13] = output.DM1
    this.txBytes[14] = output.DM2
    this.txBytes[15] = output.DM3
    this.txBytes[16] = output.DM4
    this.txBytes[17] = output.DM5
    this.txBytes[18] = output.DM6
    this.txBytes[19] = output.DM7
    this.txBytes[20] = output.DM8
    this.txBytes[21] = output.IRO_BREAK
    this.txBytes[22] = output.BZR
    this.txBytes[23] = output.LED

    this.updateCksum_(this.txBytes)
    if (TRACE) console.log('TX', this.txBytes)

    await this.writeRaw_(ctx, this.txBytes).catch((err) => {
      console.info(logTag, `write fail: ${err.message}`)
    })
    return
  }

  /**
   * Periodically send output objects to devices
   */
  private txLoop_ = (ctx: any) => {
    const logTag = 'SaeonAlControl.txLoop_()'
    uiLogger.i(logTag, 'start')

    const device = this.device_(ctx)
    this.txSubscription_ = device
      .observeOpenedOrNot()
      .pipe(
        distinctUntilChanged(),
        switchMap((opened) => (opened ? interval(TX_INTERVAL) : EMPTY)),
        exhaustMap(() => from(this.writeOutput_(ctx, logTag))),
        takeUntil(this.closeTrigger()),
      )
      .subscribe()
  }

  /**
   * copy the value of the packet to the sensor
   */
  private handleRxPacket_ = async (logTag: string, pkt: Buffer): Promise<void> => {
    if (this.forceStopping_) return
    if (this.stopped$.value) {
      if (TRACE) console.log(logTag, 'stopped')
      return
    }

    // validate packet length
    if (pkt.length < 56) {
      console.info(logTag, `handleRxPacket_() invalid pkt.length: ${pkt.length} byte`)
      return
    }

    // validate packet start mark and end mark
    if (pkt[0] !== 2 || pkt[55] !== 3) {
      console.info(
        logTag,
        `handleRxPacket_() invalid packet start,end mark(buf[0]=${pkt[0]}, buf[55]=${pkt[55]}`,
      )
      return
    }

    // unsigned 16 bit
    const u16 = (index: number) => {
      const high = pkt[index] & 0xff
      const low = pkt[index + 1] & 0xff
      return (high << 8) | low
    }

    // signed 12 bit
    const s12 = (index: number) => {
      const high = pkt[index] & 0xff
      const low = pkt[index + 1] & 0xff
      return this.makeSigned12Bit_(high, low)
    }

    // signed 16 bit
    const s16 = (index: number) => {
      const high = pkt[index] & 0xff
      const low = pkt[index + 1] & 0xff
      return this.makeSigned16Bit_(high, low)
    }

    // copy the value of the packet to the sensor
    sensors.IR1 = u16(7)
    sensors.IR2 = u16(9)
    sensors.IR3 = u16(11)
    sensors.IR4 = u16(13)
    sensors.IR5 = u16(15)
    sensors.IR6 = u16(17)
    sensors.LMC = u16(19)
    sensors.RMC = u16(21)
    sensors.STC = u16(23)
    sensors.TEMP = this.makeAdcTemp_(u16(49))
    sensors.CDS = u16(43)
    sensors.ACC_X = s12(25)
    sensors.ACC_Y = s12(27)
    sensors.ACC_Z = s12(29)
    sensors.MAG_X = s12(31)
    sensors.MAG_Y = s12(33)
    sensors.MAG_Z = s12(35)
    sensors.BAT = this.makeAdcBattery_(u16(47))
    sensors.GYR_X = s16(37)
    sensors.GYR_Y = s16(39)
    sensors.GYR_Z = s16(41)

    if (TRACE) console.log(logTag + ' accept:', JSON.stringify(sensors))
  }

  private rxLoop_ = (ctx: any) => {
    const logTag = 'SaeonAlControl.rxLoop_()'
    uiLogger.i(logTag, 'start')

    const device = this.device_(ctx)
    this.rxSubscription_ = device
      .observeOpenedOrNot()
      .pipe(
        distinctUntilChanged(),
        switchMap((opened) => {
          if (opened) {
            return device.observeReceivedData()
          } else {
            return EMPTY
          }
        }),
        sampleTime(RX_INTERVAL), // 샘플링
        tap(({ dataBuffer }) => {
          this.handleRxPacket_(logTag, dataBuffer)
        }),
        takeUntil(this.closeTrigger()),
      )
      .subscribe()
  }

  /**
   * 디바이스(serial)에 연결된 직후에 자동으로 호출됩니다
   */
  onDeviceOpened = async (ctx: any): Promise<void> => {
    const logTag = 'SaeonAlControl.onDeviceOpened()'
    uiLogger.i(logTag, 'called')
    this.rxLoop_(ctx)
    this.txLoop_(ctx)
  }

  /**
   * 디바이스(serial)가 닫히기 전에 자동으로 호출됩니다
   */
  onDeviceWillClose = async (ctx: any): Promise<void> => {
    const logTag = 'SaeonAlControl.onDeviceWillClose()'
    uiLogger.i(logTag, 'called')
    this.stopped$.next(true)

    if (this.rxSubscription_) {
      uiLogger.i(logTag, 'rxLoop stop')
      this.rxSubscription_.unsubscribe()
      this.rxSubscription_ = undefined
    } else {
      uiLogger.i(logTag, 'rxLoop already stopped')
    }

    if (this.txSubscription_) {
      uiLogger.i(logTag, 'txLoop stop')
      this.txSubscription_.unsubscribe()
      this.txSubscription_ = undefined
    } else {
      uiLogger.i(logTag, 'txLoop already stopped')
    }
    await this.forceStopAll_(ctx)
  }

  onWebSocketConnected = async (ctx: any): Promise<void> => {
    const logTag = 'SaeonAlControl.onWebSocketConnected()'
    uiLogger.i(logTag, 'called')
  }

  onWebSocketDisconnected = async (ctx: any): Promise<void> => {
    const logTag = 'SaeonAlControl.onWebSocketDisconnected()'
    uiLogger.i(logTag, 'called')

    try {
      await this.forceStopAll_(ctx)
    } catch (err) {}
  }
}
