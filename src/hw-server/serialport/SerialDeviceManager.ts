import { EMPTY, filter, map, Observable, switchMap, take } from 'rxjs'
import { IHw, ISerialDevice, IUiLogger } from 'src/custom-types'
import { ObservableField } from 'src/util/ObservableField'

export class SerialDeviceManager {
  readonly serialDevice$ = new ObservableField<ISerialDevice | null>(null)

  private lastDevice_: ISerialDevice | null = null

  constructor(
    public readonly hw: IHw, //
    private readonly uiLogger: IUiLogger,
  ) {}

  open = async (serialPortPath: string) => {
    await this.close()
    this.uiLogger.d('SerialDeviceManager.open() try open:', serialPortPath)
    const device = this.hw.openDevice({ serialPortPath, uiLogger: this.uiLogger })
    this.lastDevice_ = device
    this.serialDevice$.setValue(device)
  }

  close = async () => {
    const lastDevice = this.lastDevice_
    if (!lastDevice) {
      this.serialDevice$.setValue(null)
      return
    }

    if (lastDevice.getState() !== 'closed' && lastDevice.getState() !== 'closing') {
      this.uiLogger.d('SerialDeviceManager.close()', lastDevice.getSerialPortPath() ?? '')
      await lastDevice.close()
    }

    this.lastDevice_ = null
    this.serialDevice$.setValue(null)
  }

  getSerialDevice = (): ISerialDevice | null => {
    return this.serialDevice$.value
  }

  getConnectedSerialDevice = (): ISerialDevice | null => {
    const device = this.serialDevice$.value
    if (!device || !device.isOpened()) return null
    return device
  }

  observeDevice = (): Observable<ISerialDevice | null> => {
    return this.serialDevice$.observe()
  }

  observeConnectedDevice = (): Observable<ISerialDevice> => {
    return this.serialDevice$.observe().pipe(
      switchMap((device) => {
        if (!device) {
          return EMPTY
        } else {
          return device.observeOpenedOrNot().pipe(
            filter((opened) => opened === true),
            take(1),
            map(() => device),
          )
        }
      }),
    )
  }
}
