import {
  BehaviorSubject,
  distinctUntilChanged,
  EMPTY,
  filter,
  firstValueFrom,
  map,
  Observable,
  Subject,
  Subscription,
  switchMap,
  takeUntil,
  timeout,
} from 'rxjs'
import { SerialPort } from 'serialport'
import { BufferTimestamped, DeviceOpenState, ISerialDevice } from 'src/custom-types'
import { uiLogger } from 'src/services/hw/UiLogger'
import { RxSerialPort } from 'src/util/RxSerialPort'
import Stream from 'stream'

const DEBUG = true
const TRACE = false

function errmsg(err: any): string {
  if (typeof err === undefined || err === null) return ''
  if (typeof err === 'string') return err
  const msg = 'message' in err ? err['message'] : err
  return msg.toString()
}

type OnWriteFn = (bytes: number) => void
type OnReadFn = (bytes: number) => void

export class SerialDevice implements ISerialDevice {
  private debugTag_: string

  private deviceState$ = new BehaviorSubject<DeviceOpenState>('closed')

  private receivedData$ = new Subject<BufferTimestamped>()

  private port_: SerialPort

  private parser_?: Stream.Transform

  private stopped$ = new BehaviorSubject(false)

  private readSubscription_?: Subscription

  private hookOnWrite_?: OnWriteFn
  private hookOnRead_?: OnReadFn

  constructor(options: { debugTag: string; port: SerialPort; parser?: Stream.Transform }) {
    if (options.debugTag) {
      this.debugTag_ = `[${options.debugTag}] `
    } else {
      this.debugTag_ = ''
    }
    this.port_ = options.port
    this.parser_ = options.parser
  }

  private log_ = (message?: any, ...optionalParams: any[]) => {
    if (DEBUG) console.log(this.debugTag_, message, ...optionalParams)
  }

  setOnWrite = (fn: OnWriteFn | undefined) => {
    this.hookOnWrite_ = fn
  }

  setOnRead = (fn: OnReadFn | undefined) => {
    this.hookOnRead_ = fn
  }

  /**
   * implement ISerialDevice
   */
  getSerialPortPath(): string | undefined {
    return this.port_?.path
  }

  /**
   * implement ISerialDevice
   */
  getState = (): DeviceOpenState => {
    return this.deviceState$.value
  }

  private closeTrigger_ = () => {
    return this.stopped$.pipe(filter((it) => it === true))
  }

  /**
   * 연결 여부
   * implement ISerialDevice
   */
  isOpened = (): boolean => {
    return this.deviceState$.value === 'opened'
  }

  /**
   * 디바이스 열기
   * implement ISerialDevice
   */
  open = async (): Promise<void> => {
    const port = this.port_
    const parser = this.parser_

    const logTag = `${this.debugTag_}SerialDevice.open()`
    uiLogger.i(logTag, port.path)

    if (this.deviceState$.value === 'opened') {
      console.log('SerialDevice', 'open() already opened')
      throw new Error('already opened')
    }

    this.deviceState$.next('opening')
    this.stopped$.next(false)

    RxSerialPort.fromOpenEvent(port)
      .pipe(takeUntil(this.closeTrigger_()))
      .subscribe({
        next: () => {
          this.onOpened_(port, parser)
        },
        error: (ignore) => {
          console.log(ignore)
          uiLogger.w(logTag, `serial port open fail: ${port}, ${errmsg(ignore)}`)
        },
      })

    // open() 호출전에 error 이벤트를 감시하고 있어야 함
    RxSerialPort.fromErrorEvent(port)
      .pipe(takeUntil(this.closeTrigger_()))
      .subscribe({
        next: (err) => {
          uiLogger.e(logTag, errmsg(err))
          uiLogger.w(logTag, `serial port error occured, close port: ${port.path}`)
          this.close()
        },
        error: (ignore) => {
          console.log(ignore)
        },
      })

    if (!port.isOpen && !port.opening) {
      try {
        await new Promise<void>((resolve) => {
          port.open((err) => {
            if (err) {
              uiLogger.w(logTag, 'port open fail:' + errmsg(err))
            }
            resolve()
          })
        })
      } catch (err) {
        uiLogger.w(logTag, 'port open fail:' + errmsg(err))
        console.log(err)
      }
    }

    if (!port.readable) {
      uiLogger.w(logTag, 'port is not readable, force close')
      this.close()
    }
  }

  private onOpened_ = async (serialPort: SerialPort, parser?: Stream.Transform) => {
    const logTag = `${this.debugTag_}SerialDevice.onOpened_()`

    const { baudRate, path, ...rest } = {
      ...serialPort.port?.openOptions,
      path: serialPort.path,
      baudRate: serialPort.baudRate,
    }
    uiLogger.i(logTag, `${path}, baudRate=${baudRate},  ` + JSON.stringify(rest))

    this.port_ = serialPort
    this.parser_ = parser
    if (parser) {
      serialPort.pipe(parser)
    }
    this.deviceState$.next('opened')
    this.startReadLoop_()
  }

  private startReadLoop_ = async () => {
    const logTag = `${this.debugTag_}SerialDevice.startReadLoop()`
    uiLogger.d(logTag, 'started')

    const port = this.port_
    if (!port) {
      uiLogger.w(logTag, `SerialDevice is not opened: ${this.deviceState$.value}`)
      return
    }
    this.readSubscription_?.unsubscribe()

    port.resume()
    const source = this.parser_ ?? port
    this.readSubscription_ = RxSerialPort.fromDataEvent(source) //
      .pipe(takeUntil(this.closeTrigger_()))
      .subscribe({
        next: (dataBuffer: Buffer) => {
          if (TRACE) console.log('SerialDevice.startReadLoop()', dataBuffer)
          uiLogger.d('RX', dataBuffer)
          this.hookOnRead_?.(dataBuffer.byteLength)
          this.receivedData$.next({ timestamp: Date.now(), dataBuffer })
        },
        error: (err) => {
          uiLogger.w(logTag, errmsg(err))
        },
        complete: () => {
          uiLogger.d(logTag, 'finished')
        },
      })
  }

  /**
   * implement ISerialDevice
   */
  write = async (values: Buffer | number[]): Promise<boolean> => {
    const logTag = `${this.debugTag_}SerialDevice.write()`

    // uiLogger.d(logTag, values)

    const port = this.port_
    if (!port) {
      this.log_(logTag, `port not configured: ${this.deviceState$.value}`)
      uiLogger.w(logTag, `port not configured, ${this.deviceState$.value}`)
      return false
    }

    try {
      this.hookOnWrite_?.(values.length)
      await firstValueFrom(
        RxSerialPort.write(port, values) //
          .pipe(takeUntil(this.closeTrigger_())),
      )
      return true
    } catch (ignore) {
      uiLogger.w(logTag, `failed: ${errmsg(ignore)}`)
    }
    return false
  }

  /**
   * implement ISerialDevice
   */
  observeDeviceState = (): Observable<DeviceOpenState> => this.deviceState$.asObservable()

  /**
   * implement ISerialDevice
   */
  observeOpenedOrNot = (): Observable<boolean> =>
    this.deviceState$.asObservable().pipe(
      map((state) => state === 'opened'),
      distinctUntilChanged(),
    )

  /**
   * implement ISerialDevice
   */
  observeReceivedData = (): Observable<BufferTimestamped> => {
    return this.deviceState$.pipe(
      switchMap((state) => (state === 'opened' ? this.receivedData$.asObservable() : EMPTY)),
    )
  }

  /**
   * implement ISerialDevice
   */
  waitUntilOpen = (timeoutMillis = 0): Promise<boolean> => {
    const logTag = `${this.debugTag_}SerialDevice.waitUntilOpen()`
    if (DEBUG) this.log_(`SerialDevice.waitUntilOpen(${timeoutMillis}ms)`)
    uiLogger.d(logTag, `${timeoutMillis}ms`)

    let src$ = this.observeOpenedOrNot()
    if (timeoutMillis > 0) {
      src$ = src$.pipe(timeout(timeoutMillis))
    }
    return firstValueFrom(src$).catch(() => false)
  }

  /**
   * implement ISerialDevice
   */
  close = async (): Promise<void> => {
    const logTag = `${this.debugTag_}SerialDevice.close()`
    if (this.deviceState$.value === 'closed') {
      uiLogger.i(logTag, 'already closed')
      return
    }

    if (this.deviceState$.value === 'closing') {
      uiLogger.i(logTag, 'already closing')
      return
    }

    uiLogger.w(logTag, 'called')
    this.deviceState$.next('closing')

    if (!this.stopped$.value) {
      this.stopped$.next(true)
    }

    this.readSubscription_?.unsubscribe()
    this.readSubscription_ = undefined
    try {
      const port = this.port_
      this.parser_ = undefined

      if (port && port.isOpen) {
        await new Promise<void>((resolve) => {
          port.close((err) => {
            if (err) {
              uiLogger.i(logTag, `ignore port.close() error ${errmsg(err)}`)
            } else {
              uiLogger.i(logTag, 'port.close() success')
            }
            resolve()
          })
        })
      } else {
        uiLogger.i(logTag, 'already port closed')
      }
      port?.removeAllListeners()
    } catch (ignore) {
      uiLogger.i(logTag, 'ignore close error')
    } finally {
      this.deviceState$.next('closed')
    }
  }
}
