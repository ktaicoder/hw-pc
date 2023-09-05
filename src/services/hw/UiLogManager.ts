import { Observable, Subject } from 'rxjs'
import { IUiLogMessage } from 'src/custom-types'

export class UiLogManager {
  private readonly message$ = new Subject<IUiLogMessage>()

  addLine = (msg: IUiLogMessage) => {
    this.message$.next(msg)
  }

  observeMessage = (): Observable<IUiLogMessage> => {
    return this.message$
  }
}
