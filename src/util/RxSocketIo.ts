import { Observable } from 'rxjs'
import { Socket } from 'socket.io'

export class RxSocketIo {
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

  //   static fromMessageEvent = (socket: Socket, eventName: string): Observable<any> => {
  //     return new Observable((emitter) => {
  //       const handle = (eventNm, ...args) => {
  //         if (eventNm === eventName) {
  //           emitter.next(args[0])
  //         }
  //       }
  //       socket.onAny(handle)
  //       return () => {
  //         socket.offAny(handle)
  //       }
  //     })
  //   }
  //   static fromErrorEvent = (socket: Socket): Observable<any> => {
  //     return new Observable((emit) => {
  //       const handle = (err) => {
  //         emit.next(err)
  //       }
  //       socket.on('error', handle)
  //       return () => {
  //         socket.off('error', handle)
  //       }
  //     })
  //   }
}
