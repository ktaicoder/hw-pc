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
import { createNumberArray, sleepAsync } from '../util'
import { ISaeonSmartFarmControl } from './ISaeonSmartFarmControl'
import {
  SmartFarmOutput,
} from './saeon-smartfarm-utils'

const TRACE = false
const DEBUG = true

const TX_INTERVAL = 50
const RX_INTERVAL = 50

const sensors = {
  HUM: 0,
  HEATER: 0,
  TEMP: 0,
  SOIL: 0,
  CDS: 0,
  SW1: 0,
  SW2: 0,
  SW3: 0,
}

const output = new SmartFarmOutput()

function createDefaultTxBytes(): number[] {
  return createNumberArray(22, (arr) => {
    arr[0] = 2
    arr[1] = 16
    arr[2] = 0
    arr[3] = 1
    arr[4] = 1
    arr[21] = 3
  })
}

export class SaeonSmartFarmControl extends AbstractHwConrtol implements ISaeonSmartFarmControl {
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
    } else if (option == 'Window') {
      output.CONTROL &= 0xfe
    } else if (option == 'Fan') {
      output.CONTROL &= 0xfd
    } else if (option == 'Pump') {
      output.CONTROL &= 0xfb
    } else if (option == 'Heater') {
      output.CONTROL &= 0xf7
    } else if (option == 'Cam') {
      output.CONTROL &= 0x0f
    } else if (option == 'Led') {
      output.LED1 = 0
      output.LED2 = 0
      output.LED3 = 0
      output.LED4 = 0
      output.LED5 = 0
      output.LED6 = 0
    } else if (option == 'Display') {
      output.DIS1 = 0
      output.DIS2 = 0
      output.DIS3 = 0
      output.DIS4 = 0
      output.DIS5 = 0
      output.DIS6 = 0
      output.DIS7 = 0
      output.DIS8 = 0
      output.DIS9 = 0
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

  async switch(ctx: any, idx: string): Promise<boolean> {
    let value = false
    console.log(`switch number (${idx})`)

    if (idx == '1') {
      if (sensors.SW1 == 0) value = false
      if (sensors.SW1 == 1) value = true
    }
    if (idx == '2') {
      if (sensors.SW2 == 0) value = false
      if (sensors.SW2 == 1) value = true
    }
    if (idx == '3') {
      if (sensors.SW3 == 0) value = false
      if (sensors.SW3 == 1) value = true
    }
    return value
  }

  async window(ctx: any, option: string): Promise<void> {
    console.log(`window(${option})`)
    if (option == 'Open') {
      output.CONTROL |= 0x01
    } else if (option == 'Close') {
      output.CONTROL &= 0xfe
    }
  }

  async fan(ctx: any, option: string): Promise<void> {
    console.log(`fan(${option})`)
    if (option == 'On') {
      output.CONTROL |= 0x02
    } else if (option == 'Off') {
      output.CONTROL &= 0xfd
    }
  }

  async pump(ctx: any, option: string): Promise<void> {
    console.log(`pump(${option})`)
    if (option == 'On') {
      output.CONTROL |= 0x04
    } else if (option == 'Off') {
      output.CONTROL &= 0xfb
    }
  }

  async heater(ctx: any, option: string): Promise<void> {
    console.log(`heater(${option})`)
    if (option == 'On') {
      output.CONTROL |= 0x08
    } else if (option == 'Off') {
      output.CONTROL &= 0xf7
    }
  }

  async cam(ctx: any, angle: number): Promise<void> {
    console.log(`cam(${angle})`)
    if (angle < 0) angle = 0
    if (angle > 15) angle = 15

    output.CONTROL &= 0x0f
    output.CONTROL |= (angle << 4) & 0xf0
  }

  async led(ctx: any, idx: string, red: string, green: string, blue: string): Promise<void> {
    const _idx = Number(idx)
    const _red = Number(red)
    const _green = Number(green)
    const _blue = Number(blue)

    if (_idx == null) return
    if (_idx < 1) return
    if (_idx > 4) return

    if (red == null) return
    if (_red < 0) return
    if (_red > 15) return

    if (green == null) return
    if (_green < 0) return
    if (_green > 15) return

    if (blue == null) return
    if (_blue < 0) return
    if (_blue > 15) return

    let dst = 0
    let msk = 0xfff
    let org = 0

    dst |= _blue
    dst = (dst << 4) | _green
    dst = (dst << 4) | _red

    dst = dst << (((_idx - 1) % 2) * 12)
    msk = msk << (((_idx - 1) % 2) * 12)

    if (_idx == 1 || _idx == 2) {
      org = output.LED3
      org = (org << 8) | output.LED2
      org = (org << 8) | output.LED1

      org &= ~msk
      org |= dst

      output.LED1 = org & 0xff
      output.LED2 = (org >> 8) & 0xff
      output.LED3 = (org >> 16) & 0xff
    }

    if (_idx == 3 || _idx == 4) {
      org = output.LED6
      org = (org << 8) | output.LED5
      org = (org << 8) | output.LED4

      org &= ~msk
      org |= dst

      output.LED4 = org & 0xff
      output.LED5 = (org >> 8) & 0xff
      output.LED6 = (org >> 16) & 0xff
    }
  }

  async ledNumber(ctx: any, idx: number, red: number, green: number, blue: number): Promise<void> {
    if (idx == null) return
    if (idx < 1) return
    if (idx > 4) return

    if (red == null) return
    if (red < 0) return
    if (red > 15) return

    if (green == null) return
    if (green < 0) return
    if (green > 15) return

    if (blue == null) return
    if (blue < 0) return
    if (blue > 15) return

    let dst = 0
    let msk = 0xfff
    let org = 0

    dst |= blue
    dst = (dst << 4) | green
    dst = (dst << 4) | red

    dst = dst << (((idx - 1) % 2) * 12)
    msk = msk << (((idx - 1) % 2) * 12)

    if (idx == 1 || idx == 2) {
      org = output.LED3
      org = (org << 8) | output.LED2
      org = (org << 8) | output.LED1

      org &= ~msk
      org |= dst

      output.LED1 = org & 0xff
      output.LED2 = (org >> 8) & 0xff
      output.LED3 = (org >> 16) & 0xff
    }

    if (idx == 3 || idx == 4) {
      org = output.LED6
      org = (org << 8) | output.LED5
      org = (org << 8) | output.LED4

      org &= ~msk
      org |= dst

      output.LED4 = org & 0xff
      output.LED5 = (org >> 8) & 0xff
      output.LED6 = (org >> 16) & 0xff
    }
  }

  async display(ctx: any, st: string): Promise<void> {
    st = st.replace(/“ | ”/g, '')

    if (st == null) return
    if (st.length == 0) return

    if (st.length > 9) st = st.substring(0, 9)

    const buf = [0]
    buf.length = 0

    for (let i = 0;i < st.length;i++) {
      const asciiValue = st.charCodeAt(i)
      buf.push(asciiValue)
    }

    console.log(buf)
    const stArr = [
      output.DIS1,
      output.DIS2,
      output.DIS3,
      output.DIS4,
      output.DIS5,
      output.DIS6,
      output.DIS7,
      output.DIS8,
      output.DIS9,
    ]

    for (let i = 0;i < 9;i++) {
      stArr[i] = 32
    }

    for (let i = 0;i < buf.length;i++) {
      stArr[i] = buf[i]
    }

    output.DIS1 = stArr[0]
    output.DIS2 = stArr[1]
    output.DIS3 = stArr[2]
    output.DIS4 = stArr[3]
    output.DIS5 = stArr[4]
    output.DIS6 = stArr[5]
    output.DIS7 = stArr[6]
    output.DIS8 = stArr[7]
    output.DIS9 = stArr[8]

    console.log(this.txBytes[12])
    console.log(this.txBytes[13])
    console.log(this.txBytes[14])
    console.log(this.txBytes[15])
    console.log(this.txBytes[16])
    console.log(this.txBytes[17])
    console.log(this.txBytes[18])
    console.log(this.txBytes[19])
    console.log(this.txBytes[20])
  }

  /**
   * update checksums
   */
  private updateCksum_(array: number[]) {
    let cksum = 0
    for (let i = 3;i < 21;i++) {
      cksum += array[i]
    }
    array[2] = cksum & 0xff
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
    const logTag = 'SaeonSmartFarmControl.forceStopAll_()'
    this.forceStopping_ = true
    try {
      for (let i = 0;i < 2;i++) {
        if (i > 0) await sleepAsync(TX_INTERVAL)

        // Update the output object to stop for the txLoop.
        output.updateForStopAll()

        // create a new array and immediately write.
        const bytes = createDefaultTxBytes()
        this.updateCksum_(bytes)

        // write
        if (TRACE) console.log('TX', bytes)
        await this.writeRaw_(ctx, bytes).catch((err) => {
          console.info(logTag, `ignore, forceStopAll_() write fail: ${err.message}`)
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

    this.txBytes[5] = output.CONTROL
    this.txBytes[6] = output.LED1
    this.txBytes[7] = output.LED2
    this.txBytes[8] = output.LED3
    this.txBytes[9] = output.LED4
    this.txBytes[10] = output.LED5
    this.txBytes[11] = output.LED6
    this.txBytes[12] = output.DIS1
    this.txBytes[13] = output.DIS2
    this.txBytes[14] = output.DIS3
    this.txBytes[15] = output.DIS4
    this.txBytes[16] = output.DIS5
    this.txBytes[17] = output.DIS6
    this.txBytes[18] = output.DIS7
    this.txBytes[19] = output.DIS8
    this.txBytes[20] = output.DIS9

    this.updateCksum_(this.txBytes)
    if (TRACE) console.log('TX', this.txBytes)

    await this.writeRaw_(ctx, this.txBytes).catch((err) => {
      console.info(logTag, `write fail: ${err.message}`)
    })
  }

  private txLoop_ = (ctx: any) => {
    const logTag = 'SaeonSmartFarmControl.txLoop_()'
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
  private handleRxPacket_ = async (logTag: string, pkt: Uint8Array): Promise<void> => {
    if (this.forceStopping_) return
    if (this.stopped$.value) {
      if (TRACE) console.log(logTag, 'stopped')
      return
    }

    // validate packet length
    if (pkt.length < 22) {
      console.info(logTag, `handleRxPacket_() invalid pkt.length: ${pkt.length} byte`)
      return
    }

    // validate packet start mark and end mark
    if (pkt[0] !== 2 || pkt[21] !== 3) {
      console.info(
        logTag,
        `handleRxPacket_() invalid packet start,end mark(buf[0]=${pkt[0]}, buf[21]=${pkt[21]}`,
      )
      return
    }

    const u16 = (index: number) => {
      const high = pkt[index + 1] & 0xff
      const low = pkt[index] & 0xff
      return (high << 8) | low
    }

    // copy the value of the packet to the sensor
    sensors.HUM = u16(5) / 100
    sensors.HEATER = u16(7) / 100
    sensors.TEMP = u16(9) / 100
    sensors.SOIL = u16(11)
    sensors.CDS = u16(13)
    sensors.SW1 = (pkt[16] & 0x01) == 0x01 ? 1 : 0
    sensors.SW2 = (pkt[16] & 0x02) == 0x02 ? 1 : 0
    sensors.SW3 = (pkt[16] & 0x04) == 0x04 ? 1 : 0
    if (TRACE) console.log(logTag + ' accept:', JSON.stringify(sensors))
  }

  private rxLoop_ = (ctx: any) => {
    const logTag = 'SaeonSmartFarmControl.rxLoop_()'
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
    const logTag = 'SaeonSmartFarmControl.onDeviceOpened()'
    uiLogger.i(logTag, 'called')
    this.rxLoop_(ctx)
    this.txLoop_(ctx)
  }

  /**
   * 디바이스(serial)가 닫히기 전에 자동으로 호출됩니다
   */
  onDeviceWillClose = async (ctx: any): Promise<void> => {
    const logTag = 'SaeonSmartFarmControl.onDeviceWillClose()'
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
    const logTag = 'SaeonSmartFarmControl.onWebSocketConnected()'
    uiLogger.i(logTag, 'called')
  }

  onWebSocketDisconnected = async (ctx: any): Promise<void> => {
    const logTag = 'SaeonSmartFarmControl.onWebSocketDisconnected()'
    uiLogger.i(logTag, 'called')

    try {
      await this.forceStopAll_(ctx)
    } catch (err) { }
  }
}
