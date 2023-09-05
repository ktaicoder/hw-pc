import { Observable, Subject } from 'rxjs'
import { IHcpHwNotificationManager } from './hcp-types'

export class HcpHwNotificationManager implements IHcpHwNotificationManager {
  private notification$ = new Subject<any>()

  notify = (payload: any) => {
    this.notification$.next(payload)
  }

  observe = (): Observable<any> => {
    return this.notification$
  }
}
