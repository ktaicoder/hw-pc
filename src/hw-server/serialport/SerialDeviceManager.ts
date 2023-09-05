import { EMPTY, filter, map, Observable, switchMap, take } from 'rxjs'
import { DeviceOpenState, IHw, ISerialDevice } from 'src/custom-types'
import { uiLogger } from 'src/services/hw/UiLogger'
import { ObservableField } from 'src/util/ObservableField'

export class SerialDeviceManager {
  readonly serialDevice$ = new ObservableField<ISerialDevice | null>(null)

  constructor(
    public readonly hw: IHw
  ) {
    // empty
  }

  open = async (serialPortPath: string): Promise<ISerialDevice> => {
    await this.close()
    uiLogger.d('SerialDeviceManager.open() try open:', serialPortPath)
    const device = this.hw.openDevice({ serialPortPath }) as ISerialDevice
    this.serialDevice$.setValue(device)
    return device
  }

  close = async () => {
    const lastDevice = this.serialDevice$.value
    if (!lastDevice) {
      this.serialDevice$.setValue(null)
      return
    }

    if (lastDevice.getState() !== 'closed' && lastDevice.getState() !== 'closing') {
      uiLogger.d('SerialDeviceManager.close()', lastDevice.getSerialPortPath() ?? '')
      await lastDevice.close()
    }

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

  observeDeviceOpenState = (): Observable<DeviceOpenState> => {
    return this.serialDevice$.observe().pipe(
      switchMap((device) => {
        if (!device) {
          return EMPTY
        }
        return device.observeDeviceState()
      }),
    )
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
