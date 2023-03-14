import { ObservableField } from 'src/util/ObservableField'
import { combineLatest, map, Observable, tap } from 'rxjs'

export class DeviceStateManager {
  private txBytes$ = new ObservableField(0)
  private txTimestamp$ = new ObservableField(0)
  private rxBytes$ = new ObservableField(0)
  private rxTimestamp$ = new ObservableField(0)

  onTxOccured = (bytes: number) => {
    this.txBytes$.setValue((p) => p + bytes)
    this.txTimestamp$.setValue(Date.now())
  }

  onRxOccured = (bytes: number) => {
    this.rxBytes$.setValue((p) => p + bytes)
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
      map(([txBytes, txTimestamp, rxBytes, rxTimestamp]) => ({
        txBytes,
        txTimestamp,
        rxBytes,
        rxTimestamp,
      })),
    )
  }
}
