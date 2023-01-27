import { Observable } from 'rxjs'
import { Server, Socket } from 'socket.io'

export class RxSocketIoServer {
  static fromConnectionEvent = (io: Server): Observable<Socket> => {
    return new Observable((emit) => {
      const handle = (socket: Socket) => {
        emit.next(socket)
      }
      io.on('connection', handle)
      return () => {
        io.off('connection', handle)
      }
    })
  }
}
