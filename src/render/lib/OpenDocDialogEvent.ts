import { fromEvent, Observable } from 'rxjs'
import { filter, map } from 'rxjs/operators'
import { dispatch, EventTypes } from './common'

type Payload = {
  docId: string
}

const getStr = (obj: any, propertyName: string): string | undefined => {
  if (propertyName in obj && typeof obj[propertyName] === 'string') {
    return obj[propertyName]
  }
  return undefined
}

export class OpenDocDialogEvent {
  static send = (params: { docId: string }) => {
    dispatch(EventTypes.doc.openDialog, params)
  }

  private static retrieveEventBody = (event: any): Payload | null => {
    if (!event.detail) return null
    const detail = event.detail
    const type = event.type

    if (type === EventTypes.doc.openDialog) {
      const docId = getStr(detail, 'docId')
      if (docId) {
        return { docId }
      }
    }

    console.warn('unknown event payload', event)
    return null
  }

  static observe = (): Observable<Payload> => {
    return fromEvent(window, EventTypes.doc.openDialog).pipe(
      map((event: any) => OpenDocDialogEvent.retrieveEventBody(event)),
      filter((body) => body != null),
      map((body) => body as Payload), // as not-null
    )
  }
}
