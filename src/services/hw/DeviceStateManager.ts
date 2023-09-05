import { ObservableField } from 'src/util/ObservableField'
import { combineLatest, map, Observable, tap, throttleTime } from 'rxjs'

class DeviceStateManager {
  private txBytes$ = new ObservableField(0)
  private txTimestamp$ = new ObservableField(0)
  private rxBytes$ = new ObservableField(0)
  private rxTimestamp$ = new ObservableField(0)

  onTxOccured = (bytes: number) => {
    this.txBytes$.setValue(bytes)
    this.txTimestamp$.setValue(Date.now())
  }

  onRxOccured = (bytes: number) => {
    this.rxBytes$.setValue(bytes)
    this.rxTimestamp$.setValue(Date.now())
  }

  reset = () => {
    this.txBytes$.setValue(0)
    this.txTimestamp$.setValue(0)
    this.rxBytes$.setValue(0)
    this.rxTimestamp$.setValue(0)
  }

  observe = (): Observable<{
    txBytes: number
    txTimestamp: number
    rxBytes: number
    rxTimestamp: number
  }> => {
    return combineLatest([
      this.txBytes$.observe(),
      this.txTimestamp$.observe(),
      this.rxBytes$.observe(),
      this.rxTimestamp$.observe(),
    ]).pipe(
      throttleTime(150, undefined, { leading: true, trailing: true }),
      map(([txBytes, txTimestamp, rxBytes, rxTimestamp]) => ({
        txBytes,
        txTimestamp,
        rxBytes,
        rxTimestamp,
      })),
    )
  }
}

export const deviceStateManager = new DeviceStateManager()
