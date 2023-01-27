import { Observable } from 'rxjs'
import { Socket } from 'socket.io'

export class RxSocketIoClient {
  static fromDisconnectEvent = (socket: Socket): Observable<string | null> => {
    return new Observable((emitter) => {
      const handle = (reason: string | null) => {
        emitter.next(reason ?? null)
      }
      socket.on('disconnect', handle)
      return () => {
        socket.off('disconnect', handle)
      }
    })
  }

  static fromMessageEvent = (socket: Socket, eventName: string): Observable<any> => {
    return new Observable((emitter) => {
      const handle = (message: any) => {
        emitter.next(message)
      }
      socket.on(eventName, handle)
      return () => {
        socket.off(eventName, handle)
      }
    })
  }
}
