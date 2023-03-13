import { Observable } from 'rxjs'
import { SerialPort } from 'serialport'
import Stream from 'stream'

export class RxSerialPort {
  static fromOpenEvent = (sp: SerialPort): Observable<void> => {
    return new Observable((emitter) => {
      const handle = () => {
        emitter.next()
      }
      sp.on('open', handle)
      return () => {
        sp.off('open', handle)
      }
    })
  }

  static fromCloseEvent = (sp: SerialPort): Observable<string> => {
    return new Observable((emitter) => {
      const handle = (reason) => {
        emitter.next(reason)
      }
      sp.on('close', handle)
      return () => {
        sp.off('close', handle)
      }
    })
  }

  static fromEndEvent = (sp: SerialPort): Observable<void> => {
    return new Observable((emitter) => {
      const handle = () => {
        emitter.next()
      }
      sp.on('end', handle)
      return () => {
        sp.off('end', handle)
      }
    })
  }

  static fromErrorEvent = (sp: SerialPort): Observable<any> => {
    return new Observable((emitter) => {
      const handle = (err) => {
        emitter.next(err)
      }
      sp.on('error', handle)
      return () => {
        sp.off('error', handle)
      }
    })
  }

  static fromDataEvent = (sp: SerialPort | Stream.Transform): Observable<Buffer> => {
    return new Observable((emitter) => {
      const handle = (data: Buffer) => {
        emitter.next(data)
      }

      sp.on('data', handle)
      return () => {
        sp.off('data', handle)
      }
    })
  }

  static write = (sp: SerialPort, values: string | number[] | Buffer): Observable<void> => {
    return new Observable((emitter) => {
      if (emitter.closed) return
      if (!sp.isOpen) {
        emitter.complete()
        return
      }
      try {
        sp.write(values, (err) => {
          if (err) {
            emitter.error(err)
          } else {
            sp.drain(function () {
              emitter.next()
              emitter.complete()
            })
          }
        })
      } catch (err) {
        emitter.error(err)
      }
    })
  }
}
