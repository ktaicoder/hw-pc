import { Observable } from 'rxjs'
import { Socket } from 'socket.io-client'

export class RxSocketIoClient {
  static fromConnectEvent = (socket: Socket): Observable<void> => {
    return new Observable((emit) => {
      const handle = () => {
        emit.next()
      }

      socket.on('connect', handle)
      return () => {
        socket.off('connect', handle)
      }
    })
  }

  static fromDisconnectEvent = (socket: Socket): Observable<string> => {
    return new Observable((emit) => {
      const handle = (reason) => {
        emit.next(reason)
      }

      socket.on('disconnect', handle)
      return () => {
        socket.off('disconnect', handle)
      }
    })
  }

  static fromErrorEvent = (socket: Socket): Observable<any> => {
    return new Observable((emit) => {
      const handle = (err) => {
        emit.next(err)
      }

      socket.on('error', handle)
      return () => {
        socket.off('error', handle)
      }
    })
  }

  static fromMessageEvent = (socket: Socket, eventName: string): Observable<any> => {
    return new Observable((emit) => {
      const handle = (msg) => {
        emit.next(msg)
      }

      socket.on(eventName, handle)
      return () => {
        socket.off(eventName, handle)
      }
    })
  }
}
