import { Observable, Subject } from 'rxjs'

type Payload = {
  docId: string
}

const subject$ = new Subject<Payload>()

export class OpenDocDialogEvent {
  static send = (params: { docId: string }) => {
    subject$.next(params)
  }

  static observe = (): Observable<Payload> => {
    return subject$
  }
}
