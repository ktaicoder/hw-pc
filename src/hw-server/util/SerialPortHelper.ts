import { BehaviorSubject, filter, firstValueFrom, map, Subscription, takeUntil, timeout } from 'rxjs'
import { SerialPort } from 'serialport'
import { ObservableField } from 'src/util/ObservableField'
import { RxSerialPort } from '../../util/RxSerialPort'

const DEBUG = false

type SerialPortState = 'first' | 'opened' | 'closed' | 'ended' | 'error'

export class SerialPortHelper {
  state$ = new ObservableField<SerialPortState>('first')

  private sp_: SerialPort

  private subscription_: Subscription | null = null

  private path_?: string | null = null

  private destroyed$ = new BehaviorSubject(false)

  constructor(serialPort: SerialPort) {
    this.path_ = serialPort.path
    this.sp_ = serialPort
    if (DEBUG) console.log('SerialPortHelper.create()')
    const subscription = RxSerialPort.fromOpenEvent(this.sp_).subscribe(() => {
      this.onOpenEvent()
    })
    subscription.add(
      RxSerialPort.fromCloseEvent(this.sp_).subscribe((reason) => {
        if (DEBUG) console.log('SerialPortHelper.onClose()', reason)
        this.onCloseEvent(reason)
      }),
    )
    subscription.add(
      RxSerialPort.fromEndEvent(this.sp_)
        .pipe(takeUntil(this.closeTrigger()))
        .subscribe(() => {
          if (DEBUG) console.log('SerialPortHelper.onEnd()')
          this.state$.setValue('ended')
        }),
    )
    subscription.add(
      RxSerialPort.fromErrorEvent(this.sp_)
        .pipe(takeUntil(this.closeTrigger()))
        .subscribe((err) => {
          console.log('SerialPortHelper.onError()', err)
          this.state$.setValue('error')
        }),
    )
  }

  static create = (serialPort: SerialPort): SerialPortHelper => {
    return new SerialPortHelper(serialPort)
  }

  get serialPort(): SerialPort {
    return this.sp_
  }

  get serialPortPath(): string | null {
    return this.path_ ?? null
  }

  private closeTrigger = () => {
    return this.destroyed$.pipe(filter((it) => it === true))
  }

  isReadable = (): boolean => {
    if (DEBUG) console.log('SerialPortHelper.isOpen()', this.sp_ && this.sp_.isOpen)
    return !!this.sp_ && this.sp_.isOpen
  }

  private onCloseEvent = (reason) => {
    if (DEBUG) console.log('SerialPortHelper.onCloseEvent', reason)

    this.subscription_?.unsubscribe()
    this.subscription_ = null
    this.state$.setValue('closed')
  }

  private onOpenEvent = () => {
    if (DEBUG) console.log('SerialPortHelper.onOpenEvent()')
    this.state$.setValue('opened')
  }

  isOpened = (): boolean => {
    return this.sp_.isOpen
  }

  isOpenedOrOpening = (): boolean => {
    if (this.sp_.isOpen) return true

    if (typeof this.sp_['opening'] === 'boolean') {
      return this.sp_['opening']
    }
    return false
  }

  isClosedOrClosing = (): boolean => {
    if (typeof this.sp_['closing'] === 'boolean') {
      return this.sp_['closing']
    }

    if (this.sp_.isOpen) {
      return false
    }

    return true
  }

  isDestroyed = (): boolean => {
    return this.destroyed$.value
  }

  open = () => {
    if (this.destroyed$.value) {
      throw new Error('serialport helper destroyed, create new one')
    }
    if (DEBUG) console.log('SerialPortHelper.open()')
    if (!this.isOpenedOrOpening()) {
      try {
        this.sp_.open((err) => {
          if (err) {
            console.log('SerialPortHelper.open() ignore error ', err)
          }
        })
      } catch (ignore) {}
    }
  }

  close = () => {
    if (DEBUG) console.log('SerialPortHelper.close()')
    if (this.destroyed$.value) {
      console.log('SerialPortHelper.destroy() already destroyed')
    } else {
      this.destroyed$.next(true)
    }
    try {
      // close 체크는 이걸로 해야 한다
      if (this.sp_.isOpen) {
        this.sp_.close((err) => {
          if (err) {
            console.log('SerialPortHelper.close() ignore error ', err)
          }
        })
      } else {
        console.log('SerialPortHelper.close() already closed')
      }
    } catch (ignore) {}
  }

  waitUntilOpen = (timeoutMilli = 0): Promise<boolean> => {
    if (timeoutMilli > 0) {
      return firstValueFrom(
        this.state$.observe().pipe(
          filter((it) => it === 'opened'),
          map(() => true),
          timeout(timeoutMilli),
        ),
      )
    } else {
      return firstValueFrom(
        this.state$.observe().pipe(
          filter((it) => it === 'opened'),
          map(() => true),
        ),
      )
    }
  }
}
